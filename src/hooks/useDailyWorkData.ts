
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface DailyWorkEntry {
  id: string;
  user_id: string;
  work_date: string;
  work_description: string;
  admin_comments: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export interface DailyWorkFormData {
  work_date: string;
  work_description: string;
}

export interface AdminCommentData {
  id: string;
  admin_comments: string;
}

export const useDailyWorkData = () => {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch daily work entries based on user role
  const { data: dailyWorkEntries = [], isLoading } = useQuery({
    queryKey: ['daily-work', profile?.id, isAdmin()],
    queryFn: async () => {
      let query = supabase
        .from('daily_work')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .order('work_date', { ascending: false });

      // If not admin, only show user's own entries
      if (!isAdmin()) {
        query = query.eq('user_id', profile?.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match our interface
      return data.map(entry => ({
        ...entry,
        user: entry.profiles ? {
          full_name: entry.profiles.full_name,
          email: entry.profiles.email
        } : undefined
      })) as DailyWorkEntry[];
    },
    enabled: !!profile,
  });

  // Create daily work entry mutation
  const createDailyWorkMutation = useMutation({
    mutationFn: async (formData: DailyWorkFormData) => {
      console.log('Creating daily work entry:', formData);
      
      const { data, error } = await supabase
        .from('daily_work')
        .insert([{
          user_id: profile?.id,
          work_date: formData.work_date,
          work_description: formData.work_description,
        }])
        .select();

      if (error) {
        console.error('Daily work creation error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-work'] });
      toast({
        title: "Success",
        description: "Daily work entry added successfully",
      });
    },
    onError: (error) => {
      console.error('Daily work creation error:', error);
      toast({
        title: "Error",
        description: "Failed to add daily work entry",
        variant: "destructive",
      });
    },
  });

  // Update daily work entry mutation (for users)
  const updateDailyWorkMutation = useMutation({
    mutationFn: async (formData: DailyWorkFormData & { id: string }) => {
      console.log('Updating daily work entry:', formData);
      
      const { data, error } = await supabase
        .from('daily_work')
        .update({
          work_date: formData.work_date,
          work_description: formData.work_description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.id)
        .eq('user_id', profile?.id) // Ensure user can only update their own entries
        .select();

      if (error) {
        console.error('Daily work update error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-work'] });
      toast({
        title: "Success",
        description: "Daily work entry updated successfully",
      });
    },
    onError: (error) => {
      console.error('Daily work update error:', error);
      toast({
        title: "Error",
        description: "Failed to update daily work entry",
        variant: "destructive",
      });
    },
  });

  // Add admin comment mutation (for admins only)
  const addAdminCommentMutation = useMutation({
    mutationFn: async (commentData: AdminCommentData) => {
      console.log('Adding admin comment:', commentData);
      
      if (!isAdmin()) {
        throw new Error('Only admins can add comments');
      }

      const { data, error } = await supabase
        .from('daily_work')
        .update({
          admin_comments: commentData.admin_comments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentData.id)
        .select();

      if (error) {
        console.error('Admin comment error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-work'] });
      toast({
        title: "Success",
        description: "Admin comment added successfully",
      });
    },
    onError: (error) => {
      console.error('Admin comment error:', error);
      toast({
        title: "Error",
        description: "Failed to add admin comment",
        variant: "destructive",
      });
    },
  });

  // Delete daily work entry mutation
  const deleteDailyWorkMutation = useMutation({
    mutationFn: async (entryId: string) => {
      console.log('Deleting daily work entry:', entryId);
      
      const { error } = await supabase
        .from('daily_work')
        .delete()
        .eq('id', entryId)
        .eq('user_id', profile?.id); // Ensure user can only delete their own entries

      if (error) {
        console.error('Daily work delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-work'] });
      toast({
        title: "Success",
        description: "Daily work entry deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Daily work delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete daily work entry",
        variant: "destructive",
      });
    },
  });

  return {
    dailyWorkEntries,
    isLoading,
    createDailyWork: createDailyWorkMutation.mutate,
    isCreating: createDailyWorkMutation.isPending,
    updateDailyWork: updateDailyWorkMutation.mutate,
    isUpdating: updateDailyWorkMutation.isPending,
    addAdminComment: addAdminCommentMutation.mutate,
    isAddingComment: addAdminCommentMutation.isPending,
    deleteDailyWork: deleteDailyWorkMutation.mutate,
    isDeleting: deleteDailyWorkMutation.isPending,
  };
};
