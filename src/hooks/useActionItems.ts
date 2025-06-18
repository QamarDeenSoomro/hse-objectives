import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ActionItem, ActionItemFormData, ActionItemClosureFormData, ActionItemVerificationFormData } from "@/types/actionItems";

export const useActionItems = () => {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch action items based on user role
  const { data: actionItems = [], isLoading } = useQuery({
    queryKey: ['action-items', profile?.id, isAdmin()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_items')
        .select(`
          *,
          assigned_user:profiles!assigned_to(full_name, email),
          verifier:profiles!verifier_id(full_name, email),
          creator:profiles!created_by(full_name, email),
          closure:action_item_closures(
            *,
            closer:profiles!closed_by(full_name, email)
          ),
          verification:action_item_verifications(
            *,
            verifier:profiles!verified_by(full_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActionItem[];
    },
    enabled: !!profile,
  });

  // Create action item mutation
  const createActionItemMutation = useMutation({
    mutationFn: async (formData: ActionItemFormData) => {
      const { data, error } = await supabase
        .from('action_items')
        .insert([{
          title: formData.title,
          description: formData.description,
          target_date: formData.target_date,
          priority: formData.priority,
          assigned_to: formData.assigned_to,
          verifier_id: formData.verifier_id || null,
          created_by: profile?.id,
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-items'] });
      toast({
        title: "Success",
        description: "Action item created successfully",
      });
    },
    onError: (error) => {
      console.error('Action item creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create action item",
        variant: "destructive",
      });
    },
  });

  // Update action item mutation
  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ActionItemFormData }) => {
      const { data, error } = await supabase
        .from('action_items')
        .update({
          title: formData.title,
          description: formData.description,
          target_date: formData.target_date,
          priority: formData.priority,
          assigned_to: formData.assigned_to,
          verifier_id: formData.verifier_id || null,
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-items'] });
      toast({
        title: "Success",
        description: "Action item updated successfully",
      });
    },
    onError: (error) => {
      console.error('Action item update error:', error);
      toast({
        title: "Error",
        description: "Failed to update action item",
        variant: "destructive",
      });
    },
  });

  // Delete action item mutation
  const deleteActionItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('action_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-items'] });
      toast({
        title: "Success",
        description: "Action item deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Action item delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete action item",
        variant: "destructive",
      });
    },
  });

  // Close action item mutation
  const closeActionItemMutation = useMutation({
    mutationFn: async ({ actionItemId, formData }: { actionItemId: string; formData: ActionItemClosureFormData }) => {
      // Upload media files first if any
      let mediaUrls: string[] = [];
      if (formData.media_files && formData.media_files.length > 0) {
        for (const file of formData.media_files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `action-items/${actionItemId}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('action-item-media')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Media upload error:', uploadError);
            throw uploadError;
          }

          const { data } = supabase.storage
            .from('action-item-media')
            .getPublicUrl(fileName);
          
          mediaUrls.push(data.publicUrl);
        }
      }

      const { data, error } = await supabase
        .from('action_item_closures')
        .insert([{
          action_item_id: actionItemId,
          closure_text: formData.closure_text,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          closed_by: profile?.id,
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-items'] });
      toast({
        title: "Success",
        description: "Action item closed successfully",
      });
    },
    onError: (error) => {
      console.error('Action item closure error:', error);
      toast({
        title: "Error",
        description: "Failed to close action item",
        variant: "destructive",
      });
    },
  });

  // Verify action item mutation
  const verifyActionItemMutation = useMutation({
    mutationFn: async ({ actionItemId, formData }: { actionItemId: string; formData: ActionItemVerificationFormData }) => {
      const { data, error } = await supabase
        .from('action_item_verifications')
        .insert([{
          action_item_id: actionItemId,
          verification_status: formData.verification_status,
          verification_comments: formData.verification_comments,
          verified_by: profile?.id,
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-items'] });
      toast({
        title: "Success",
        description: "Action item verification completed",
      });
    },
    onError: (error) => {
      console.error('Action item verification error:', error);
      toast({
        title: "Error",
        description: "Failed to verify action item",
        variant: "destructive",
      });
    },
  });

  return {
    actionItems,
    isLoading,
    createActionItem: createActionItemMutation.mutate,
    isCreating: createActionItemMutation.isPending,
    updateActionItem: updateActionItemMutation.mutate,
    isUpdating: updateActionItemMutation.isPending,
    deleteActionItem: deleteActionItemMutation.mutate,
    isDeleting: deleteActionItemMutation.isPending,
    closeActionItem: closeActionItemMutation.mutate,
    isClosing: closeActionItemMutation.isPending,
    verifyActionItem: verifyActionItemMutation.mutate,
    isVerifying: verifyActionItemMutation.isPending,
  };
};