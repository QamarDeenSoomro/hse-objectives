import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, storage } from "@/integrations/firebase/client";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

      const q = query(collection(db, "action_items"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionItem));

      // Note: Firestore doesn't support joins like Supabase.
      // Fetching related data (assigned_user, verifier, etc.) needs to be handled separately.
      // For now, we'll just return the raw items.
      return items;
    },
    enabled: !!profile,
  });

  const createActionItemMutation = useMutation({
    mutationFn: async (formData: ActionItemFormData) => {
      if (!profile) throw new Error("User not authenticated");

      const docRef = await addDoc(collection(db, "action_items"), {
        ...formData,
        created_by: profile.id,
        created_at: Timestamp.now(),
      });
      return docRef;
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

  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ActionItemFormData }) => {
      const docRef = doc(db, "action_items", id);
      await updateDoc(docRef, {
        ...formData,
      });
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
      const docRef = doc(db, "action_items", id);
      await deleteDoc(docRef);
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
          const fileRef = ref(storage, `action-items/${actionItemId}/${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          mediaUrls.push(url);
        }
      }

      await addDoc(collection(db, "action_item_closures"), {
        action_item_id: actionItemId,
        closure_text: formData.closure_text,
        media_urls: mediaUrls,
        closed_by: profile.id,
        created_at: Timestamp.now(),
      });
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

      await addDoc(collection(db, "action_item_verifications"), {
        action_item_id: actionItemId,
        ...formData,
        verified_by: profile.id,
        created_at: Timestamp.now(),
      });
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