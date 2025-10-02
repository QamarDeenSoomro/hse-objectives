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

const calculatePlannedProgress = (targetDate: string) => {
  const startDate = new Date('2025-01-01');
  const endDate = new Date(targetDate);
  const currentDate = new Date();
  if (currentDate < startDate) return 0;
  if (currentDate > endDate) return 100;
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = currentDate.getTime() - startDate.getTime();
  const plannedProgress = (elapsedDuration / totalDuration) * 100;
  return Math.round(Math.max(0, Math.min(100, plannedProgress)));
};

interface ObjectiveUpdate {
  update_date: string;
  achieved_count: number;
  efficiency?: number | null;
}

const calculateCumulativeProgress = (updates: ObjectiveUpdate[], numActivities: number) => {
  if (!updates || updates.length === 0) return 0;
  const sortedUpdates = updates.sort((a, b) => new Date(a.update_date).getTime() - new Date(b.update_date).getTime());
  const totalAchievedCount = sortedUpdates.reduce((total, update) => total + (update.achieved_count || 0), 0);
  const rawProgress = (totalAchievedCount / numActivities) * 100;
  const latestUpdate = sortedUpdates[sortedUpdates.length - 1];
  const efficiency = latestUpdate?.efficiency || 100;
  const effectiveProgress = (rawProgress * efficiency) / 100;
  return Math.round(Math.min(100, effectiveProgress));
};

export const useDashboardData = () => {
  const { profile, isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData', profile?.id, isAdmin()],
    queryFn: async () => {
      if (!profile) return null;

      // Fetch objectives
      let objectivesQuery = supabase
        .from('objectives')
        .select('*');

      if (!isAdmin()) {
        objectivesQuery = objectivesQuery.eq('owner_id', profile.id);
      }

      const { data: objectives, error: objError } = await objectivesQuery;
      if (objError) throw objError;

      // Fetch all users if admin
      let allUsers = [{ id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role }];
      if (isAdmin()) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'user');
        
        if (usersError) throw usersError;
        allUsers = usersData;
      }

      // Fetch all updates
      let updatesQuery = supabase
        .from('objective_updates')
        .select('*');

      if (!isAdmin()) {
        updatesQuery = updatesQuery.eq('user_id', profile.id);
      }

      const { data: allUpdates, error: updError } = await updatesQuery;
      if (updError) throw updError;

      // Join data
      const objectivesWithUpdates = objectives!.map((obj: any) => ({
        ...obj,
        updates: allUpdates!.filter((upd: any) => upd.objective_id === obj.id)
      }));

      // Calculations
      const averagePlannedProgress = objectives!.length > 0
        ? Math.round(objectives!.reduce((acc: number, obj: any) => acc + calculatePlannedProgress(obj.target_completion_date), 0) / objectives!.length)
        : 0;

      const stats: DashboardStats = {
        totalObjectives: objectives!.length,
        averageCompletion: objectives!.length > 0
          ? Math.round(objectivesWithUpdates.reduce((acc: number, obj: any) => acc + calculateCumulativeProgress(obj.updates, obj.num_activities), 0) / objectives!.length)
          : 0,
        totalActivities: allUpdates!.reduce((acc: number, update: any) => acc + (update.achieved_count * (update.efficiency || 100)) / 100, 0),
        plannedActivities: objectives!.reduce((acc: number, obj: any) => acc + obj.num_activities, 0),
        averagePlannedProgress,
      };

      const teamData: TeamMember[] = allUsers.map((user: any) => {
        const userObjectives = objectivesWithUpdates.filter((obj: any) => obj.owner_id === user.id);
        let totalCompletion = 0;
        let totalPlannedProgress = 0;
        userObjectives.forEach((objective: any) => {
          totalCompletion += calculateCumulativeProgress(objective.updates, objective.num_activities);
          totalPlannedProgress += calculatePlannedProgress(objective.target_completion_date);
        });
        const averageCompletion = userObjectives.length > 0 ? Math.round(totalCompletion / userObjectives.length) : 0;
        const averagePlannedProgress = userObjectives.length > 0 ? Math.round(totalPlannedProgress / userObjectives.length) : 0;
        const userUpdates = allUpdates!.filter((update: any) => update.user_id === user.id);
        const totalEffectiveActivities = userUpdates.reduce((acc: number, update: any) => acc + (update.achieved_count * (update.efficiency || 100)) / 100, 0);
        const lastUpdate = userUpdates.reduce((latest: any, update: any) => 
          new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest, null);

        return {
          id: user.id,
          name: user.full_name || user.email,
          completion: averageCompletion,
          activities: Math.round(totalEffectiveActivities),
          lastUpdate: lastUpdate?.update_date || new Date().toISOString().split('T')[0],
          plannedProgress: averagePlannedProgress,
        };
      });

      const groupedObjectiveStatuses: { [ownerName: string]: ObjectiveStatus[] } = objectivesWithUpdates.reduce((acc: any, objective: any) => {
        const owner = allUsers.find((u: any) => u.id === objective.owner_id);
        const ownerName = isAdmin() ? owner?.full_name || 'Unassigned' : 'My Objectives';
        const objectiveData: ObjectiveStatus = {
          id: objective.id,
          title: objective.title,
          completion: calculateCumulativeProgress(objective.updates, objective.num_activities),
          weightage: Number(objective.weightage),
          ownerName: isAdmin() ? owner?.full_name || 'Unassigned' : undefined,
          plannedProgress: calculatePlannedProgress(objective.target_completion_date),
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
        isAdmin: isAdmin(),
      };
    },
    enabled: !!profile,
  });

  return {
    stats: data?.stats,
    teamData: data?.teamData,
    groupedObjectiveStatuses: data?.groupedObjectiveStatuses,
    isLoading,
    isAdmin: data?.isAdmin,
  };
};
