import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  totalObjectives: number;
  averageCompletion: number;
  totalActivities: number;
  plannedActivities: number;
  averagePlannedProgress: number;
}

interface TeamMember {
  id: string;
  name: string;
  completion: number;
  activities: number;
  lastUpdate: string;
  plannedProgress: number;
}

interface ObjectiveStatus {
  id: string;
  title: string;
  completion: number;
  weightage: number;
  ownerName?: string;
  plannedProgress: number;
}

// Helper function to calculate planned progress based on time elapsed
const calculatePlannedProgress = (targetDate: string) => {
  const startDate = new Date('2025-01-01');
  const endDate = new Date(targetDate);
  const currentDate = new Date();
  
  // If current date is before start date, planned progress is 0
  if (currentDate < startDate) return 0;
  
  // If current date is after end date, planned progress is 100
  if (currentDate > endDate) return 100;
  
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = currentDate.getTime() - startDate.getTime();
  
  const plannedProgress = (elapsedDuration / totalDuration) * 100;
  return Math.round(Math.max(0, Math.min(100, plannedProgress)));
};

export const useDashboardData = () => {
  const { profile, isAdmin } = useAuth();

  const { data: objectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['objectives', profile?.id, isAdmin()],
    queryFn: async () => {
      let query = supabase
        .from('objectives')
        .select(`
          *,
          owner:profiles!owner_id(id, full_name),
          updates:objective_updates(achieved_count, update_date, efficiency)
        `);
      
      // If not admin, only show user's own objectives
      if (!isAdmin() && profile?.id) {
        query = query.eq('owner_id', profile.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', isAdmin()],
    queryFn: async () => {
      if (!isAdmin()) {
        // Regular users only see their own data
        return profile ? [profile] : [];
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user');
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const { data: allUpdates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['objective_updates', profile?.id, isAdmin()],
    queryFn: async () => {
      let query = supabase
        .from('objective_updates')
        .select(`
          *,
          user:profiles!user_id(id, full_name),
          objective:objectives!objective_id(title, num_activities)
        `);
      
      // If not admin, only show user's own updates
      if (!isAdmin() && profile?.id) {
        query = query.eq('user_id', profile.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const isLoading = objectivesLoading || usersLoading || updatesLoading;

  // Helper function to calculate effective progress based on efficiency
  const calculateEffectiveProgress = (achievedCount: number, totalActivities: number, efficiency: number = 100) => {
    const rawProgress = (achievedCount / totalActivities) * 100;
    return (rawProgress * efficiency) / 100;
  };

  // Calculate average planned progress across all objectives
  const averagePlannedProgress = objectives.length > 0 
    ? Math.round(objectives.reduce((acc, obj) => {
        const plannedProgress = calculatePlannedProgress(obj.target_completion_date);
        return acc + plannedProgress;
      }, 0) / objectives.length)
    : 0;

  // Calculate dashboard statistics
  const stats: DashboardStats = {
    totalObjectives: objectives.length,
    averageCompletion: objectives.length > 0 
      ? Math.round(objectives.reduce((acc, obj) => {
          const latestUpdate = obj.updates?.reduce((latest: any, update: any) => 
            new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest
          , null);
          
          let completion = 0;
          if (latestUpdate) {
            completion = calculateEffectiveProgress(
              latestUpdate.achieved_count, 
              obj.num_activities, 
              latestUpdate.efficiency || 100
            );
            completion = Math.min(100, completion);
          }
          return acc + completion;
        }, 0) / objectives.length)
      : 0,
    totalActivities: allUpdates.reduce((acc, update) => {
      const effectiveCount = (update.achieved_count * (update.efficiency || 100)) / 100;
      return acc + effectiveCount;
    }, 0),
    plannedActivities: objectives.reduce((acc, obj) => acc + obj.num_activities, 0),
    averagePlannedProgress,
  };

  // Calculate team performance based on objectives average instead of activities
  const teamData: TeamMember[] = allUsers.map(user => {
    const userObjectives = objectives.filter(obj => obj.owner_id === user.id);
    
    // Calculate average completion across all objectives for this user
    let totalCompletion = 0;
    let totalPlannedProgress = 0;
    let objectiveCount = userObjectives.length; // Count ALL objectives, even those with 0% progress
    
    userObjectives.forEach(objective => {
      const latestUpdate = objective.updates?.reduce((latest: any, update: any) => 
        new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest
      , null);
      
      let completion = 0; // Default to 0 for objectives without updates
      if (latestUpdate) {
        completion = calculateEffectiveProgress(
          latestUpdate.achieved_count, 
          objective.num_activities, 
          latestUpdate.efficiency || 100
        );
        completion = Math.min(100, completion);
      }
      
      const plannedProgress = calculatePlannedProgress(objective.target_completion_date);
      
      totalCompletion += completion; // Add completion (0 if no updates) to total
      totalPlannedProgress += plannedProgress;
    });
    
    const averageCompletion = objectiveCount > 0 ? Math.round(totalCompletion / objectiveCount) : 0;
    const averagePlannedProgress = objectiveCount > 0 ? Math.round(totalPlannedProgress / objectiveCount) : 0;
    
    // Calculate total effective activities for display purposes
    const userUpdates = allUpdates.filter(update => update.user_id === user.id);
    const totalEffectiveActivities = userUpdates.reduce((acc, update) => {
      const effectiveCount = (update.achieved_count * (update.efficiency || 100)) / 100;
      return acc + effectiveCount;
    }, 0);
    
    const lastUpdate = userUpdates.reduce((latest, update) => 
      new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest
    , null);

    return {
      id: user.id,
      name: user.full_name || user.email,
      completion: averageCompletion,
      activities: Math.round(totalEffectiveActivities),
      lastUpdate: lastUpdate?.update_date || new Date().toISOString().split('T')[0],
      plannedProgress: averagePlannedProgress,
    };
  });

  // Calculate objective statuses with efficiency-based completion
  const groupedObjectiveStatuses: { [ownerName: string]: ObjectiveStatus[] } = objectives.reduce((acc, objective) => {
    const latestUpdate = objective.updates?.reduce((latest: any, update: any) => 
      new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest
    , null);
    
    let completion = 0;
    if (latestUpdate) {
      completion = calculateEffectiveProgress(
        latestUpdate.achieved_count, 
        objective.num_activities, 
        latestUpdate.efficiency || 100
      );
      completion = Math.min(100, Math.round(completion));
    }

    const plannedProgress = calculatePlannedProgress(objective.target_completion_date);
    const ownerName = isAdmin() ? objective.owner?.full_name || 'Unassigned' : 'My Objectives';

    const objectiveData: ObjectiveStatus = {
      id: objective.id,
      title: objective.title,
      completion,
      weightage: Number(objective.weightage),
      ownerName: isAdmin() ? objective.owner?.full_name || 'Unassigned' : undefined,
      plannedProgress,
    };

    if (!acc[ownerName]) {
      acc[ownerName] = [];
    }
    acc[ownerName].push(objectiveData);
    return acc;
  }, {} as { [ownerName: string]: ObjectiveStatus[] });

  return {
    stats,
    teamData,
    groupedObjectiveStatuses,
    isLoading,
    isAdmin: isAdmin(),
  };
};