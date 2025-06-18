import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Objective, UserProfile, ObjectiveFormData } from "@/types/objectives";
import { calculateCumulativeProgress, getDateFromQuarter, getQuarterInfo } from "@/utils/objectives";

export const useObjectivesData = (userIdFromUrl?: string | null) => {
  const { isAdmin, profile } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [objectiveProgress, setObjectiveProgress] = useState<Record<string, number>>({});

  const fetchObjectives = async () => {
    try {
      let query = supabase
        .from('objectives')
        .select(`
          *,
          owner:profiles!objectives_owner_id_fkey(full_name, email),
          creator:profiles!objectives_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filtering based on user role and URL parameters
      if (isAdmin()) {
        if (userIdFromUrl) {
          query = query.eq('owner_id', userIdFromUrl);
        }
      } else {
        if (profile && profile.id) {
          query = query.eq('owner_id', profile.id);
        } else {
          console.error("Error: Non-admin user profile or profile ID is missing. Cannot fetch objectives.");
          setObjectives([]);
          setLoading(false);
          toast({
            title: "Error",
            description: "User profile not found. Cannot fetch objectives.",
            variant: "destructive",
          });
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setObjectives(data || []);
      
      if (data) {
        await fetchObjectiveProgress(data);
      }
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
  };

  const fetchObjectiveProgress = async (objectives: Objective[]) => {
    const progressMap: Record<string, number> = {};
    
    for (const objective of objectives) {
      try {
        const { data: updates } = await supabase
          .from('objective_updates')
          .select('achieved_count, efficiency, update_date')
          .eq('objective_id', objective.id)
          .order('update_date', { ascending: true });

        if (updates && updates.length > 0) {
          const progress = calculateCumulativeProgress(updates, objective.num_activities);
          progressMap[objective.id] = progress;
        } else {
          progressMap[objective.id] = 0;
        }
      } catch (error) {
        console.error(`Error fetching progress for objective ${objective.id}:`, error);
        progressMap[objective.id] = 0;
      }
    }
    
    setObjectiveProgress(progressMap);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createObjective = async (formData: ObjectiveFormData) => {
    try {
      const targetDate = getDateFromQuarter(formData.targetQuarter, 2025);
      
      const objectiveData = {
        title: formData.title,
        description: formData.description,
        weightage: parseFloat(formData.weightage),
        num_activities: parseInt(formData.numActivities),
        owner_id: isAdmin() ? formData.ownerId : profile?.id,
        created_by: profile?.id,
        target_completion_date: targetDate,
      };

      const { error } = await supabase
        .from('objectives')
        .insert([objectiveData]);

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
    try {
      const targetDate = getDateFromQuarter(formData.targetQuarter, 2025);
      
      const objectiveData = {
        title: formData.title,
        description: formData.description,
        weightage: parseFloat(formData.weightage),
        num_activities: parseInt(formData.numActivities),
        owner_id: isAdmin() ? formData.ownerId : profile?.id,
        created_by: profile?.id,
        target_completion_date: targetDate,
      };

      const { error } = await supabase
        .from('objectives')
        .update(objectiveData)
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
    fetchObjectives();
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin, profile, userIdFromUrl]);

  return {
    objectives,
    users,
    loading,
    objectiveProgress,
    createObjective,
    updateObjective,
    deleteObjective,
    refetchObjectives: fetchObjectives,
  };
};