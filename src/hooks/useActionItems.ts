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
  documentId,
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

      // 1. Fetch action items
      const actionItemsQuery = query(collection(db, "action_items"), orderBy("created_at", "desc"));
      const actionItemsSnapshot = await getDocs(actionItemsQuery);
      const actionItems = actionItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionItem));

      if (actionItems.length === 0) {
        return [];
      }

      const actionItemIds = actionItems.map(item => item.id);

      // 2. Fetch closures
      const closuresQuery = query(collection(db, "action_item_closures"), where("action_item_id", "in", actionItemIds));
      const closuresSnapshot = await getDocs(closuresQuery);
      const closures = closuresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Fetch verifications
      const verificationsQuery = query(collection(db, "action_item_verifications"), where("action_item_id", "in", actionItemIds));
      const verificationsSnapshot = await getDocs(verificationsQuery);
      const verifications = verificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 4. Collect all user IDs
      const userIds = new Set<string>();
      actionItems.forEach(item => {
        if (item.assigned_to) userIds.add(item.assigned_to);
        if (item.verifier_id) userIds.add(item.verifier_id);
        if (item.created_by) userIds.add(item.created_by);
      });
      closures.forEach((closure: { closed_by: string; }) => {
        if (closure.closed_by) userIds.add(closure.closed_by);
      });
      verifications.forEach((verification: { verified_by: string; }) => {
        if (verification.verified_by) userIds.add(verification.verified_by);
      });

      const uniqueUserIds = Array.from(userIds).filter(id => id);

      // 5. Fetch profiles
      const profiles: { [key: string]: { id: string, full_name: string, email: string, role: string } } = {};
      if (uniqueUserIds.length > 0) {
        const chunkSize = 30;
        for (let i = 0; i < uniqueUserIds.length; i += chunkSize) {
            const chunk = uniqueUserIds.slice(i, i + chunkSize);
            if (chunk.length > 0) {
                const profilesQuery = query(collection(db, "profiles"), where(documentId(), "in", chunk));
                const profilesSnapshot = await getDocs(profilesQuery);
                profilesSnapshot.forEach(doc => {
                    profiles[doc.id] = { id: doc.id, ...(doc.data() as { full_name: string, email: string, role: string }) };
                });
            }
        }
      }

      // 6. Stitch data together
      const enrichedClosures = closures.map((closure: {id: string, action_item_id: string, closed_by: string}) => ({
        ...closure,
        closer: profiles[closure.closed_by] || null,
      }));

      const enrichedVerifications = verifications.map((verification: {id: string, action_item_id: string, verified_by: string}) => ({
        ...verification,
        verifier: profiles[verification.verified_by] || null,
      }));

      const enrichedActionItems = actionItems.map((item: ActionItem) => {
        return {
          ...item,
          assigned_user: profiles[item.assigned_to] || null,
          verifier: profiles[item.verifier_id!] || null,
          creator: profiles[item.created_by] || null,
          closure: enrichedClosures.find(c => c.action_item_id === item.id) || null,
          verification: enrichedVerifications.find(v => v.action_item_id === item.id) || null,
        };
      });

      return enrichedActionItems;
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