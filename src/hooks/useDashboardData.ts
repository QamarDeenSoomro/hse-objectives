import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
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

// Helper functions remain the same as they are client-side logic
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
    efficiency?: number;
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
      let objectivesQuery = query(collection(db, "objectives"));
      if (!isAdmin()) {
        objectivesQuery = query(objectivesQuery, where("owner_id", "==", profile.id));
      }
      const objectivesSnapshot = await getDocs(objectivesQuery);
      const objectives = objectivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch all updates
      const updatesQuery = query(collection(db, "objective_updates"));
      const updatesSnapshot = await getDocs(updatesQuery);
      const allUpdates = updatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Collect user IDs from objectives and updates
      const userIds = new Set<string>();
      objectives.forEach((obj: { owner_id: string; }) => userIds.add(obj.owner_id));
      allUpdates.forEach((upd: { user_id: string; }) => userIds.add(upd.user_id));

      // Fetch all necessary user profiles
      const allUsers: { [key: string]: { id: string, full_name: string, email: string, role: string } } = {};
      const uniqueUserIds = Array.from(userIds).filter(id => id);
      if (uniqueUserIds.length > 0) {
        const usersQuery = query(collection(db, "profiles"), where("id", "in", uniqueUserIds));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => {
            allUsers[doc.id] = { id: doc.id, ...(doc.data() as { full_name: string, email: string, role: string }) };
        });
      }

      // Manually join data
      const objectivesWithUpdates = objectives.map((obj: { owner_id: string; id: string; }) => ({
          ...obj,
          owner: allUsers[obj.owner_id],
          updates: allUpdates.filter((upd: { objective_id: string; }) => upd.objective_id === obj.id)
      }));

      // Calculations
      const averagePlannedProgress = objectives.length > 0
        ? Math.round(objectives.reduce((acc, obj) => acc + calculatePlannedProgress(obj.target_completion_date), 0) / objectives.length)
        : 0;

      const stats: DashboardStats = {
        totalObjectives: objectives.length,
        averageCompletion: objectives.length > 0
          ? Math.round(objectivesWithUpdates.reduce((acc, obj) => acc + calculateCumulativeProgress(obj.updates, obj.num_activities), 0) / objectives.length)
          : 0,
        totalActivities: allUpdates.reduce((acc, update) => acc + (update.achieved_count * (update.efficiency || 100)) / 100, 0),
        plannedActivities: objectives.reduce((acc, obj) => acc + obj.num_activities, 0),
        averagePlannedProgress,
      };

      const teamData: TeamMember[] = Object.values(allUsers).map((user: { id: string; full_name: string; email: string; }) => {
        const userObjectives = objectivesWithUpdates.filter(obj => obj.owner_id === user.id);
        let totalCompletion = 0;
        let totalPlannedProgress = 0;
        userObjectives.forEach(objective => {
          totalCompletion += calculateCumulativeProgress(objective.updates, objective.num_activities);
          totalPlannedProgress += calculatePlannedProgress(objective.target_completion_date);
        });
        const averageCompletion = userObjectives.length > 0 ? Math.round(totalCompletion / userObjectives.length) : 0;
        const averagePlannedProgress = userObjectives.length > 0 ? Math.round(totalPlannedProgress / userObjectives.length) : 0;
        const userUpdates = allUpdates.filter((update: { user_id: string; }) => update.user_id === user.id);
        const totalEffectiveActivities = userUpdates.reduce((acc, update: { achieved_count: number; efficiency: number; }) => acc + (update.achieved_count * (update.efficiency || 100)) / 100, 0);
        const lastUpdate = userUpdates.reduce((latest: { update_date: string; } | null, update: { update_date: string; }) => new Date(update.update_date) > new Date(latest?.update_date || '1970-01-01') ? update : latest, null);

        return {
          id: user.id,
          name: user.full_name || user.email,
          completion: averageCompletion,
          activities: Math.round(totalEffectiveActivities),
          lastUpdate: lastUpdate?.update_date || new Date().toISOString().split('T')[0],
          plannedProgress: averagePlannedProgress,
        };
      });

      const groupedObjectiveStatuses: { [ownerName: string]: ObjectiveStatus[] } = objectivesWithUpdates.reduce((acc, objective: { owner: { full_name: string; }; id: string; title: string; updates: ObjectiveUpdate[]; num_activities: number; weightage: string; target_completion_date: string; }) => {
        const ownerName = isAdmin() ? objective.owner?.full_name || 'Unassigned' : 'My Objectives';
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
