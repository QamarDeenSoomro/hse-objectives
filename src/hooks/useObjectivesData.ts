import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      let query = supabase
        .from('objectives')
        .select('*, owner:profiles!objectives_owner_id_fkey(full_name, email), creator:profiles!objectives_created_by_fkey(full_name, email)')
        .order('created_at', { ascending: false });

      if (isAdmin()) {
        if (userIdFromUrl) {
          query = query.eq('owner_id', userIdFromUrl);
        }
      } else {
        query = query.eq('owner_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setObjectives(data as Objective[]);
      await fetchObjectiveProgress(data as Objective[]);
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
    if (objectives.length === 0) {
      setObjectiveProgress({});
      return;
    }

    try {
      const objectiveIds = objectives.map(obj => obj.id);
      
      // Fetch all updates in a single query
      const { data: allUpdates, error } = await supabase
        .from('objective_updates')
        .select('*')
        .in('objective_id', objectiveIds)
        .order('update_date', { ascending: true });

      if (error) {
        console.error('Error fetching updates:', error);
        // Set all to 0 on error
        const progressMap: Record<string, number> = {};
        objectives.forEach(obj => {
          progressMap[obj.id] = 0;
        });
        setObjectiveProgress(progressMap);
        return;
      }

      // Group updates by objective_id
      const updatesByObjective: Record<string, any[]> = {};
      (allUpdates || []).forEach(update => {
        if (!updatesByObjective[update.objective_id]) {
          updatesByObjective[update.objective_id] = [];
        }
        updatesByObjective[update.objective_id].push(update);
      });

      // Calculate progress for each objective
      const progressMap: Record<string, number> = {};
      objectives.forEach(objective => {
        const updates = updatesByObjective[objective.id] || [];
        progressMap[objective.id] = calculateCumulativeProgress(updates, objective.num_activities);
      });

      setObjectiveProgress(progressMap);
    } catch (error) {
      console.error('Error fetching objective progress:', error);
      // Set all to 0 on error
      const progressMap: Record<string, number> = {};
      objectives.forEach(obj => {
        progressMap[obj.id] = 0;
      });
      setObjectiveProgress(progressMap);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setUsers(data as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createObjective = async (formData: ObjectiveFormData) => {
    if (!profile) return;
    try {
      const targetDate = getDateFromQuarter(formData.targetQuarter, 2025);
      const { error } = await supabase
        .from('objectives')
        .insert({
          title: formData.title,
          description: formData.description,
          weightage: parseFloat(formData.weightage),
          num_activities: parseInt(formData.numActivities),
          owner_id: isAdmin() ? formData.ownerId : profile.id,
          created_by: profile.id,
          target_completion_date: targetDate,
        });

      if (error) throw error;

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
      const { error } = await supabase
        .from('objectives')
        .update({
          title: formData.title,
          description: formData.description,
          weightage: parseFloat(formData.weightage),
          num_activities: parseInt(formData.numActivities),
          owner_id: isAdmin() ? formData.ownerId : profile.id,
          target_completion_date: targetDate,
        })
        .eq('id', objectiveId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
