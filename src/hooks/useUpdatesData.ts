import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface UpdateFormData {
  objectiveId: string;
  achievedCount: number;
  updateDate: string;
  photos?: File[];
  comments?: string;
}

interface EditUpdateData {
  id: string;
  achievedCount: number;
  updateDate: string;
  photos?: File[];
  efficiency?: number;
  comments?: string;
}

export const useUpdatesData = () => {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's objectives that they can update
  const { data: userObjectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['user-objectives', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectives')
        .select('*')
        .eq('owner_id', profile?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch updates based on user role
  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['updates', profile?.id, isAdmin()],
    queryFn: async () => {
      let query = supabase
        .from('objective_updates')
        .select(`
          *,
          objective:objectives!objective_id(title, num_activities, target_completion_date),
          user:profiles!user_id(full_name, email)
        `)
        .order('update_date', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Helper function to check if updates are allowed for an objective
  const checkUpdateDeadline = async (objectiveId: string): Promise<boolean> => {
    try {
      const { data: objective, error } = await supabase
        .from('objectives')
        .select('target_completion_date')
        .eq('id', objectiveId)
        .single();

      if (error) {
        console.error('Error fetching objective deadline:', error);
        return false;
      }

      if (!objective?.target_completion_date) {
        return true; // Allow if no deadline is set
      }

      const targetDate = new Date(objective.target_completion_date);
      const currentDate = new Date();
      
      // Set time to end of day for target date to allow updates on the target date
      targetDate.setHours(23, 59, 59, 999);

      return currentDate <= targetDate;
    } catch (error) {
      console.error('Error checking update deadline:', error);
      return false;
    }
  };

  // Helper function to calculate cumulative achieved count
  const calculateCumulativeCount = async (objectiveId: string, excludeUpdateId?: string): Promise<number> => {
    try {
      let query = supabase
        .from('objective_updates')
        .select('achieved_count')
        .eq('objective_id', objectiveId)
        .order('update_date', { ascending: true });

      if (excludeUpdateId) {
        query = query.neq('id', excludeUpdateId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Sum all achieved counts to get cumulative total
      return (data || []).reduce((total, update) => total + update.achieved_count, 0);
    } catch (error) {
      console.error('Error calculating cumulative count:', error);
      return 0;
    }
  };

  // Create update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (formData: UpdateFormData) => {
      console.log('Creating update with data:', formData);
      
      // Check if updates are allowed for this objective
      const isUpdateAllowed = await checkUpdateDeadline(formData.objectiveId);
      
      if (!isUpdateAllowed) {
        throw new Error('Updates are no longer allowed for this objective as the target completion date has passed.');
      }
      
      // Upload photos first if any
      let photoUrls: string[] = [];
      if (formData.photos && formData.photos.length > 0) {
        console.log('Uploading photos:', formData.photos.length);
        
        for (const photo of formData.photos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${profile?.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('update-photos')
            .upload(fileName, photo);

          if (uploadError) {
            console.error('Photo upload error:', uploadError);
            throw uploadError;
          }

          const { data } = supabase.storage
            .from('update-photos')
            .getPublicUrl(fileName);
          
          photoUrls.push(data.publicUrl);
        }
      }

      // Create the update record with the achieved_count as an incremental value
      // The achieved_count represents the additional activities completed in this update
      const { data, error } = await supabase
        .from('objective_updates')
        .insert([{
          objective_id: formData.objectiveId,
          user_id: profile?.id,
          achieved_count: formData.achievedCount, // This is the incremental count for this update
          update_date: formData.updateDate,
          photos: photoUrls.length > 0 ? photoUrls : null,
          efficiency: 100.00, // Default efficiency
          comments: formData.comments || null,
        }])
        .select();

      if (error) {
        console.error('Update creation error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast({
        title: "Success",
        description: "Update added successfully",
      });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      
      // Check if it's a deadline-related error
      if (error.message.includes('target completion date has passed')) {
        toast({
          title: "Update Not Allowed",
          description: "The deadline for this objective has passed. Updates are no longer permitted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add update",
          variant: "destructive",
        });
      }
    },
  });

  // Update existing update mutation (for admins)
  const updateUpdateMutation = useMutation({
    mutationFn: async (formData: EditUpdateData) => {
      console.log('Updating update with data:', formData);
      
      // First, get the objective_id from the update being edited
      const { data: existingUpdate, error: fetchError } = await supabase
        .from('objective_updates')
        .select('objective_id')
        .eq('id', formData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching existing update:', fetchError);
        throw new Error('Failed to fetch update details');
      }

      // Check if updates are allowed for this objective
      const isUpdateAllowed = await checkUpdateDeadline(existingUpdate.objective_id);
      
      if (!isUpdateAllowed) {
        throw new Error('Updates are no longer allowed for this objective as the target completion date has passed.');
      }
      
      // Upload new photos if any
      let photoUrls: string[] = [];
      if (formData.photos && formData.photos.length > 0) {
        console.log('Uploading new photos:', formData.photos.length);
        
        for (const photo of formData.photos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${profile?.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('update-photos')
            .upload(fileName, photo);

          if (uploadError) {
            console.error('Photo upload error:', uploadError);
            throw uploadError;
          }

          const { data } = supabase.storage
            .from('update-photos')
            .getPublicUrl(fileName);
          
          photoUrls.push(data.publicUrl);
        }
      }

      // Update the record - achieved_count is still the incremental value for this specific update
      const updateData: any = {
        achieved_count: formData.achievedCount, // This is the incremental count for this specific update
        update_date: formData.updateDate,
        comments: formData.comments || null,
      };

      if (photoUrls.length > 0) {
        updateData.photos = photoUrls;
      }

      // Only admins can update efficiency
      if (formData.efficiency !== undefined && isAdmin()) {
        updateData.efficiency = formData.efficiency;
      }

      const { data, error } = await supabase
        .from('objective_updates')
        .update(updateData)
        .eq('id', formData.id)
        .select();

      if (error) {
        console.error('Update edit error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
      toast({
        title: "Success",
        description: "Update modified successfully",
      });
    },
    onError: (error) => {
      console.error('Update edit mutation error:', error);
      
      // Check if it's a deadline-related error
      if (error.message.includes('target completion date has passed')) {
        toast({
          title: "Update Not Allowed",
          description: "The deadline for this objective has passed. Updates are no longer permitted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to modify update",
          variant: "destructive",
        });
      }
    },
  });

  // Delete update mutation (for admins)
  const deleteUpdateMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase
        .from('objective_updates')
        .delete()
        .eq('id', updateId);

      if (error) {
        console.error('Update delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
      toast({
        title: "Success",
        description: "Update deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Update delete mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to delete update",
        variant: "destructive",
      });
    },
  });

  return {
    userObjectives,
    updates,
    isLoading: objectivesLoading || updatesLoading,
    createUpdate: createUpdateMutation.mutate,
    isCreating: createUpdateMutation.isPending,
    updateUpdate: updateUpdateMutation.mutate,
    isUpdating: updateUpdateMutation.isPending,
    deleteUpdate: deleteUpdateMutation.mutate,
    isDeleting: deleteUpdateMutation.isPending,
    checkUpdateDeadline, // Export the helper function for use in components
    calculateCumulativeCount, // Export the new helper function
  };
};