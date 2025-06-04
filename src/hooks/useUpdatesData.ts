
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

      // Create the update record
      const { data, error } = await supabase
        .from('objective_updates')
        .insert([{
          objective_id: formData.objectiveId,
          user_id: profile?.id,
          achieved_count: formData.achievedCount,
          update_date: formData.updateDate,
          photos: photoUrls.length > 0 ? photoUrls : null,
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

  return {
    userObjectives,
    updates,
    isLoading: objectivesLoading || updatesLoading,
    createUpdate: createUpdateMutation.mutate,
    isCreating: createUpdateMutation.isPending,
  };
};
