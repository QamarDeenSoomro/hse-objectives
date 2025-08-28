import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface DailyWorkEntry {
  id: string;
  user_id: string;
  work_date: string;
  work_description: string;
  admin_comments: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
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

      let q;
      if (isAdmin()) {
        q = query(collection(db, "daily_work"), orderBy("work_date", "desc"));
      } else {
        q = query(
          collection(db, "daily_work"),
          where("user_id", "==", profile.id),
          orderBy("work_date", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyWorkEntry));

      if (items.length === 0) {
        return [];
      }

      const userIds = Array.from(new Set(items.map(item => item.user_id).filter(id => id)));

      const profiles: { [key: string]: { id: string, full_name: string, email: string, role: string } } = {};
      if (userIds.length > 0) {
        const chunkSize = 30;
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            if(chunk.length > 0) {
                const profilesQuery = query(collection(db, "profiles"), where(documentId(), "in", chunk));
                const profilesSnapshot = await getDocs(profilesQuery);
                profilesSnapshot.forEach(doc => {
                    profiles[doc.id] = { id: doc.id, ...(doc.data() as { full_name: string, email: string, role: string }) };
                });
            }
        }
      }

      const enrichedItems = items.map(item => ({
        ...item,
        user: profiles[item.user_id] || null,
      }));

      return enrichedItems;
    },
    enabled: !!profile,
  });

  const createDailyWorkMutation = useMutation({
    mutationFn: async (formData: DailyWorkFormData) => {
      if (!profile) throw new Error("User not authenticated");

      await addDoc(collection(db, "daily_work"), {
        user_id: profile.id,
        ...formData,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
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
        const docRef = doc(db, "daily_work", formData.id);
        await updateDoc(docRef, {
            ...formData,
            updated_at: Timestamp.now(),
        });
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
      const docRef = doc(db, "daily_work", commentData.id);
      await updateDoc(docRef, {
        admin_comments: commentData.admin_comments,
        updated_at: Timestamp.now(),
      });
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
        const docRef = doc(db, "daily_work", entryId);
        // We should add a security rule in Firestore to ensure users can only delete their own entries.
        await deleteDoc(docRef);
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
