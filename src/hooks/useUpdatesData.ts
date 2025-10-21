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

  const { data: userObjectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['user-objectives', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('objectives')
        .select('*')
        .eq('owner_id', profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['updates', profile?.id, isAdmin()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objective_updates')
        .select(`
          *,
          user:profiles!objective_updates_user_id_fkey(full_name, email),
          objective:objectives(title, num_activities)
        `)
        .order('update_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const checkUpdateDeadline = async (objectiveId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('objectives')
      .select('target_completion_date')
      .eq('id', objectiveId)
      .single();

    if (error || !data) return true;
    
    const targetDate = new Date(data.target_completion_date);
    targetDate.setHours(23, 59, 59, 999);
    return new Date() <= targetDate;
  };

  const calculateCumulativeCount = async (objectiveId: string, excludeUpdateId?: string): Promise<number> => {
    const { data, error } = await supabase
      .from('objective_updates')
      .select('id, achieved_count')
      .eq('objective_id', objectiveId);

    if (error) return 0;

    return data.reduce((total, update: any) => {
      if (excludeUpdateId && update.id === excludeUpdateId) return total;
      return total + update.achieved_count;
    }, 0);
  };

  const createUpdateMutation = useMutation({
    mutationFn: async (formData: UpdateFormData) => {
      if (!profile) throw new Error("User not authenticated");
      if (!(await checkUpdateDeadline(formData.objectiveId))) {
        throw new Error('Updates are no longer allowed for this objective as the target completion date has passed.');
      }
      
      const photoUrls: string[] = [];
      if (formData.photos && formData.photos.length > 0) {
        for (const photo of formData.photos) {
          const fileExt = photo.name.split('.').pop();
          const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('update-photos')
            .upload(filePath, photo);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('update-photos')
            .getPublicUrl(filePath);

          photoUrls.push(publicUrl);
        }
      }

      const { error } = await supabase
        .from('objective_updates')
        .insert({
          objective_id: formData.objectiveId,
          user_id: profile.id,
          achieved_count: formData.achievedCount,
          update_date: formData.updateDate,
          photos: photoUrls,
          efficiency: 100.00,
          comments: formData.comments || null,
        });

      if (error) throw error;

      // Return update details for WhatsApp message generation
      return {
        objectiveId: formData.objectiveId,
        achievedCount: formData.achievedCount,
        updateDate: formData.updateDate,
        comments: formData.comments,
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUpdateMutation = useMutation({
    mutationFn: async (formData: EditUpdateData) => {
      if (!profile) throw new Error("User not authenticated");
      
      const { data: existingUpdate, error: fetchError } = await supabase
        .from('objective_updates')
        .select('objective_id')
        .eq('id', formData.id)
        .single();

      if (fetchError || !existingUpdate) throw new Error("Update not found");

      if (!(await checkUpdateDeadline(existingUpdate.objective_id))) {
        throw new Error('Updates are no longer allowed for this objective as the target completion date has passed.');
      }
      
      const photoUrls: string[] = [];
      if (formData.photos && formData.photos.length > 0) {
        for (const photo of formData.photos) {
          const fileExt = photo.name.split('.').pop();
          const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('update-photos')
            .upload(filePath, photo);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('update-photos')
            .getPublicUrl(filePath);

          photoUrls.push(publicUrl);
        }
      }

      const updateData: any = {
        achieved_count: formData.achievedCount,
        update_date: formData.updateDate,
        comments: formData.comments || null,
      };
      
      if (photoUrls.length > 0) updateData.photos = photoUrls;
      if (formData.efficiency !== undefined && isAdmin()) {
        updateData.efficiency = formData.efficiency;
      }
      
      const { error } = await supabase
        .from('objective_updates')
        .update(updateData)
        .eq('id', formData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
      toast({ title: "Success", description: "Update modified successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase
        .from('objective_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
      toast({ title: "Success", description: "Update deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete update", variant: "destructive" });
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
    checkUpdateDeadline,
    calculateCumulativeCount,
  };
};
