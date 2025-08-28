
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { loadProfiles, findDisplayName, ProfileRow } from "./profileHelpers";

function dateInRange(dateStr: string, from?: Date, to?: Date): boolean {
  if (!from && !to) return true;
  const date = new Date(dateStr);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function generateTeamPerformanceData(dateFrom?: Date, dateTo?: Date, selectedUser?: string) {
  let profileRows: ProfileRow[] = [];
  profileRows = await loadProfiles();
  let relevantUsers = profileRows;
  if (selectedUser && selectedUser !== "all-users") {
    relevantUsers = profileRows.filter(u => u.id === selectedUser);
  }
  const data: any[] = [];
  for (const user of relevantUsers) {
    const objectivesQuery = query(collection(db, "objectives"), where("owner_id", "==", user.id));
    const objectivesSnapshot = await getDocs(objectivesQuery);
    const objs = objectivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let completedObjectives = 0, pendingObjectives = 0;
    let lastActivityDate: Date | null = null;
    for (const o of objs) {
      const updatesQuery = query(
          collection(db, "objective_updates"),
          where("objective_id", "==", o.id),
          orderBy("update_date", "desc")
      );
      const updatesSnapshot = await getDocs(updatesQuery);
      const updates = updatesSnapshot.docs.map(doc => doc.data());

      if (updates && updates.length > 0) {
        const lastUpdate = updates[0];
        if (lastUpdate.achieved_count >= 100) completedObjectives++;
        else pendingObjectives++;
        const updDate = new Date(lastUpdate.update_date);
        if (!lastActivityDate || updDate > lastActivityDate) lastActivityDate = updDate;
      } else {
        pendingObjectives++;
      }
    }
    const total = (objs?.length || 0);
    const efficiency = total > 0
      ? Math.floor((completedObjectives / total) * 100)
      : 0;
    data.push({
      teamMember: findDisplayName(user),
      completedObjectives,
      pendingObjectives,
      efficiency,
      lastActivity: lastActivityDate ? lastActivityDate : null
    });
  }
  return data;
}
