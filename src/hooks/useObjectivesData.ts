import { useState, useEffect, useCallback } from "react";
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
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Objective, UserProfile, ObjectiveFormData } from "@/types/objectives";
import { calculateCumulativeProgress, getDateFromQuarter } from "@/utils/objectives";

export const useObjectivesData = (userIdFromUrl?: string | null) => {
  const { isAdmin, profile, loading: authLoading } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [objectiveProgress, setObjectiveProgress] = useState<Record<string, number>>({});

  const fetchObjectives = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let q = query(collection(db, "objectives"), orderBy("created_at", "desc"));

      if (isAdmin()) {
        if (userIdFromUrl) {
          q = query(q, where("owner_id", "==", userIdFromUrl));
        }
      } else {
        q = query(q, where("owner_id", "==", profile.id));
      }

      const querySnapshot = await getDocs(q);
      const fetchedObjectives = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Objective));
      setObjectives(fetchedObjectives);
      await fetchObjectiveProgress(fetchedObjectives);
    } catch (error) {
      console.error('Error fetching objectives:', error);
      toast({
        title: "Error",
        description: "Failed to fetch objectives",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile, isAdmin, userIdFromUrl]);

  const fetchObjectiveProgress = async (objectives: Objective[]) => {
    const progressMap: Record<string, number> = {};
    for (const objective of objectives) {
      try {
        const updatesQuery = query(
          collection(db, "objective_updates"),
          where("objective_id", "==", objective.id),
          orderBy("update_date", "asc")
        );
        const updatesSnapshot = await getDocs(updatesQuery);
        const updates = updatesSnapshot.docs.map(doc => doc.data());
        progressMap[objective.id] = calculateCumulativeProgress(updates, objective.num_activities);
      } catch (error) {
        console.error(`Error fetching progress for objective ${objective.id}:`, error);
        progressMap[objective.id] = 0;
      }
    }
    setObjectiveProgress(progressMap);
  };

  const fetchUsers = async () => {
    try {
      const usersQuery = query(collection(db, "profiles"), orderBy("full_name"));
      const usersSnapshot = await getDocs(usersQuery);
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createObjective = async (formData: ObjectiveFormData) => {
    if (!profile) return;
    try {
      const targetDate = getDateFromQuarter(formData.targetQuarter, 2025);
      await addDoc(collection(db, "objectives"), {
        ...formData,
        weightage: parseFloat(formData.weightage),
        num_activities: parseInt(formData.numActivities),
        owner_id: isAdmin() ? formData.ownerId : profile.id,
        created_by: profile.id,
        target_completion_date: targetDate,
        created_at: Timestamp.now(),
      });
      toast({
        title: "Success",
        description: "Objective created successfully",
      });
      fetchObjectives();
    } catch (error) {
      console.error('Error creating objective:', error);
      toast({
        title: "Error",
        description: "Failed to create objective",
        variant: "destructive",
      });
    }
  };

  const updateObjective = async (objectiveId: string, formData: ObjectiveFormData) => {
    if (!profile) return;
    try {
      const targetDate = getDateFromQuarter(formData.targetQuarter, 2025);
      const docRef = doc(db, "objectives", objectiveId);
      await updateDoc(docRef, {
        ...formData,
        weightage: parseFloat(formData.weightage),
        num_activities: parseInt(formData.numActivities),
        owner_id: isAdmin() ? formData.ownerId : profile.id,
        target_completion_date: targetDate,
      });
      toast({
        title: "Success",
        description: "Objective updated successfully",
      });
      fetchObjectives();
    } catch (error) {
      console.error('Error updating objective:', error);
      toast({
        title: "Error",
        description: "Failed to update objective",
        variant: "destructive",
      });
    }
  };

  const deleteObjective = async (id: string) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;
    try {
      await deleteDoc(doc(db, "objectives", id));
      toast({
        title: "Success",
        description: "Objective deleted successfully",
      });
      fetchObjectives();
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Error",
        description: "Failed to delete objective",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (profile) {
      fetchObjectives();
      if (isAdmin()) {
        fetchUsers();
      }
    } else {
      setLoading(false);
    }
  }, [isAdmin, profile, userIdFromUrl, authLoading, fetchObjectives]);

  return {
    objectives,
    users,
    loading: loading || authLoading,
    objectiveProgress,
    createObjective,
    updateObjective,
    deleteObjective,
    refetchObjectives: fetchObjectives,
  };
};