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

  const { data: dailyWorkEntries = [], isLoading } = useQuery({
    queryKey: ['daily-work', profile?.id, isAdmin()],
    queryFn: async () => {
      if (!profile) return [];

      let query = supabase
        .from('daily_work')
        .select('*, user:profiles!daily_work_user_id_fkey(full_name, email)')
        .order('work_date', { ascending: false });

      if (!isAdmin()) {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DailyWorkEntry[];
    },
    enabled: !!profile,
  });

  const createDailyWorkMutation = useMutation({
    mutationFn: async (formData: DailyWorkFormData) => {
      if (!profile) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('daily_work')
        .insert({
          user_id: profile.id,
          ...formData,
        });

      if (error) throw error;
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

  const updateDailyWorkMutation = useMutation({
    mutationFn: async (formData: DailyWorkFormData & { id: string }) => {
      if (!profile) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('daily_work')
        .update(formData)
        .eq('id', formData.id);

      if (error) throw error;
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

  const addAdminCommentMutation = useMutation({
    mutationFn: async (commentData: AdminCommentData) => {
      if (!isAdmin()) {
        throw new Error('Only admins can add comments');
      }
      
      const { error } = await supabase
        .from('daily_work')
        .update({ admin_comments: commentData.admin_comments })
        .eq('id', commentData.id);

      if (error) throw error;
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

  const deleteDailyWorkMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!profile) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('daily_work')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
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
