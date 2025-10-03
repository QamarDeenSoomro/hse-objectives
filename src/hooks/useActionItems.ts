import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ActionItem, ActionItemFormData, ActionItemClosureFormData, ActionItemVerificationFormData } from "@/types/actionItems";

export const useActionItems = () => {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: actionItems = [], isLoading } = useQuery({
    queryKey: ['action-items', profile?.id, isAdmin()],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from('action_items')
        .select(`
          *,
          assigned_user:profiles!action_items_assigned_to_fkey(full_name, email),
          verifier:profiles!action_items_verifier_id_fkey(full_name, email),
          creator:profiles!action_items_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch closures and verifications separately
      const itemsWithDetails = await Promise.all((data || []).map(async (item) => {
        const { data: closures } = await supabase
          .from('action_item_closures')
          .select('*, closer:profiles!action_item_closures_closed_by_fkey(full_name, email)')
          .eq('action_item_id', item.id)
          .single();
        
        const { data: verifications } = await supabase
          .from('action_item_verifications')
          .select('*, verifier:profiles!action_item_verifications_verified_by_fkey(full_name, email)')
          .eq('action_item_id', item.id)
          .single();
        
        return {
          ...item,
          closure: closures || undefined,
          verification: verifications || undefined,
        };
      }));
      
      return itemsWithDetails as ActionItem[];
    },
    enabled: !!profile,
  });

  const createActionItemMutation = useMutation({
    mutationFn: async (formData: ActionItemFormData) => {
      if (!profile) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('action_items')
        .insert({
          ...formData,
          created_by: profile.id,
        });

      if (error) throw error;
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

  const bulkCreateActionItemsMutation = useMutation({
    mutationFn: async (formDataArray: ActionItemFormData[]) => {
      if (!profile) throw new Error("User not authenticated");

      const itemsToInsert = formDataArray.map(formData => ({
        ...formData,
        created_by: profile.id,
      }));

      const { error } = await supabase
        .from('action_items')
        .insert(itemsToInsert);

      if (error) throw error;
      return itemsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['action-items'] });
      toast({
        title: "Success",
        description: `${count} action items uploaded successfully`,
      });
    },
    onError: (error) => {
      console.error('Bulk action item creation error:', error);
      toast({
        title: "Error",
        description: "Failed to upload action items",
        variant: "destructive",
      });
    },
  });

  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ActionItemFormData }) => {
      const { error } = await supabase
        .from('action_items')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
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

  const closeActionItemMutation = useMutation({
    mutationFn: async ({ actionItemId, formData }: { actionItemId: string; formData: ActionItemClosureFormData }) => {
      if (!profile) throw new Error("User not authenticated");
      const mediaUrls: string[] = [];

      if (formData.media_files && formData.media_files.length > 0) {
        for (const file of formData.media_files) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('action-item-media')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('action-item-media')
            .getPublicUrl(filePath);

          mediaUrls.push(publicUrl);
        }
      }

      const { error } = await supabase
        .from('action_item_closures')
        .insert({
          action_item_id: actionItemId,
          closure_text: formData.closure_text,
          media_urls: mediaUrls,
          closed_by: profile.id,
        });

      if (error) throw error;
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

  const verifyActionItemMutation = useMutation({
    mutationFn: async ({ actionItemId, formData }: { actionItemId: string; formData: ActionItemVerificationFormData }) => {
      if (!profile) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('action_item_verifications')
        .insert({
          action_item_id: actionItemId,
          ...formData,
          verified_by: profile.id,
        });

      if (error) throw error;
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
    bulkCreateActionItems: bulkCreateActionItemsMutation.mutate,
    isBulkCreating: bulkCreateActionItemsMutation.isPending,
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
