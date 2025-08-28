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
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

interface UpdateData {
    achieved_count: number;
    update_date: string;
    comments: string | null;
    photos?: string[];
    efficiency?: number;
}

export const useUpdatesData = () => {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: userObjectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['user-objectives', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const q = query(collection(db, "objectives"), where("owner_id", "==", profile.id));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!profile,
  });

  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['updates', profile?.id, isAdmin()],
    queryFn: async () => {
      const q = query(collection(db, "objective_updates"), orderBy("update_date", "desc"));
      const snapshot = await getDocs(q);
      // Manual join would be needed here if we need objective/user details
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!profile,
  });

  const checkUpdateDeadline = async (objectiveId: string): Promise<boolean> => {
    const docRef = doc(db, "objectives", objectiveId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || !docSnap.data().target_completion_date) return true;
    const targetDate = (docSnap.data().target_completion_date as Timestamp).toDate();
    targetDate.setHours(23, 59, 59, 999);
    return new Date() <= targetDate;
  };

  const calculateCumulativeCount = async (objectiveId: string, excludeUpdateId?: string): Promise<number> => {
    const q = query(collection(db, "objective_updates"), where("objective_id", "==", objectiveId));
    const snapshot = await getDocs(q);
    let total = 0;
    snapshot.forEach(doc => {
      if (excludeUpdateId && doc.id === excludeUpdateId) return;
      total += doc.data().achieved_count;
    });
    return total;
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
          const photoRef = ref(storage, `update-photos/${profile.id}/${Date.now()}_${photo.name}`);
          await uploadBytes(photoRef, photo);
          photoUrls.push(await getDownloadURL(photoRef));
        }
      }
      await addDoc(collection(db, "objective_updates"), {
        objective_id: formData.objectiveId,
        user_id: profile.id,
        achieved_count: formData.achievedCount,
        update_date: formData.updateDate,
        photos: photoUrls,
        efficiency: 100.00,
        comments: formData.comments || null,
        created_at: Timestamp.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast({ title: "Success", description: "Update added successfully" });
    },
    onError: (error: Error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUpdateMutation = useMutation({
    mutationFn: async (formData: EditUpdateData) => {
        if (!profile) throw new Error("User not authenticated");
        const updateRef = doc(db, "objective_updates", formData.id);
        const existingUpdate = await getDoc(updateRef);
        if(!existingUpdate.exists()) throw new Error("Update not found");

        if (!(await checkUpdateDeadline(existingUpdate.data().objective_id))) {
            throw new Error('Updates are no longer allowed for this objective as the target completion date has passed.');
        }
        
        const photoUrls: string[] = [];
        if (formData.photos && formData.photos.length > 0) {
            for (const photo of formData.photos) {
                const photoRef = ref(storage, `update-photos/${profile.id}/${Date.now()}_${photo.name}`);
                await uploadBytes(photoRef, photo);
                photoUrls.push(await getDownloadURL(photoRef));
            }
        }

        const updateData: UpdateData = {
            achieved_count: formData.achievedCount,
            update_date: formData.updateDate,
            comments: formData.comments || null,
        };
        if(photoUrls.length > 0) updateData.photos = photoUrls;
        if(formData.efficiency !== undefined && isAdmin()) {
            updateData.efficiency = formData.efficiency;
        }
        await updateDoc(updateRef, updateData);
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
        await deleteDoc(doc(db, "objective_updates", updateId));
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
