
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  totalObjectives: number;
  averageCompletion: number;
  totalActivities: number;
  plannedActivities: number;
}

interface TeamMember {
  id: string;
  name: string;
  completion: number;
  activities: number;
  lastUpdate: string;
}

interface ObjectiveStatus {
  id: string;
  title: string;
  completion: number;
  weightage: number;
  ownerName?: string;
}

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
          updates:objective_updates(achieved_count, update_date)
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

  // Calculate dashboard statistics
  const stats: DashboardStats = {
    totalObjectives: objectives.length,
    averageCompletion: objectives.length > 0 
      ? Math.round(objectives.reduce((acc, obj) => {
          const latestUpdate = obj.updates?.reduce((latest: any, update: any) => 
            new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest
          , null);
          const completion = latestUpdate 
            ? Math.min(100, Math.round((latestUpdate.achieved_count / obj.num_activities) * 100))
            : 0;
          return acc + completion;
        }, 0) / objectives.length)
      : 0,
    totalActivities: allUpdates.reduce((acc, update) => acc + update.achieved_count, 0),
    plannedActivities: objectives.reduce((acc, obj) => acc + obj.num_activities, 0),
  };

  // Calculate team performance
  const teamData: TeamMember[] = allUsers.map(user => {
    const userUpdates = allUpdates.filter(update => update.user_id === user.id);
    const userObjectives = objectives.filter(obj => obj.owner_id === user.id);
    
    const totalActivities = userUpdates.reduce((acc, update) => acc + update.achieved_count, 0);
    const totalPlanned = userObjectives.reduce((acc, obj) => acc + obj.num_activities, 0);
    const completion = totalPlanned > 0 ? Math.round((totalActivities / totalPlanned) * 100) : 0;
    
    const lastUpdate = userUpdates.reduce((latest, update) => 
      new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest
    , null);

    return {
      id: user.id,
      name: user.full_name || user.email,
      completion: completion,
      activities: totalActivities,
      lastUpdate: lastUpdate?.update_date || new Date().toISOString().split('T')[0],
    };
  });

  // Calculate objective statuses
  const groupedObjectiveStatuses: { [ownerName: string]: ObjectiveStatus[] } = objectives.reduce((acc, objective) => {
    const latestUpdate = objective.updates?.reduce((latest: any, update: any) => 
      new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest
    , null);
    
    const completion = latestUpdate 
      ? Math.min(100, Math.round((latestUpdate.achieved_count / objective.num_activities) * 100))
      : 0;

    // Group non-admin objectives under "My Objectives" or handle as per existing logic for non-admins
    const ownerName = isAdmin() ? objective.owner?.full_name || 'Unassigned' : 'My Objectives';

    const objectiveData: ObjectiveStatus = {
      id: objective.id,
      title: objective.title,
      completion,
      weightage: Number(objective.weightage),
      ownerName: isAdmin() ? objective.owner?.full_name || 'Unassigned' : undefined, // Keep ownerName for now
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
