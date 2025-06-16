
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface UpdateFormData {
  objectiveId: string;
  achievedCount: number;
  updateDate: string;
  photos?: File[];
}

interface EditUpdateData {
  id: string;
  achievedCount: number;
  updateDate: string;
  photos?: File[];
  efficiency?: number;
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
          objective:objectives!objective_id(title, num_activities),
          user:profiles!user_id(full_name, email)
        `)
        .order('update_date', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Create update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (formData: UpdateFormData) => {
      console.log('Creating update with data:', formData);
      
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

      // Create the update record with default efficiency of 100%
      const { data, error } = await supabase
        .from('objective_updates')
        .insert([{
          objective_id: formData.objectiveId,
          user_id: profile?.id,
          achieved_count: formData.achievedCount,
          update_date: formData.updateDate,
          photos: photoUrls.length > 0 ? photoUrls : null,
          efficiency: 100.00, // Default efficiency
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
      toast({
        title: "Error",
        description: "Failed to add update",
        variant: "destructive",
      });
    },
  });

  // Update existing update mutation (for admins)
  const updateUpdateMutation = useMutation({
    mutationFn: async (formData: EditUpdateData) => {
      console.log('Updating update with data:', formData);
      
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

      // Update the record
      const updateData: any = {
        achieved_count: formData.achievedCount,
        update_date: formData.updateDate,
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
      toast({
        title: "Error",
        description: "Failed to modify update",
        variant: "destructive",
      });
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
  };
};
