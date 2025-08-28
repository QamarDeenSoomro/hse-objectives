
import { db } from "@/integrations/firebase/client";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { loadProfiles, findDisplayName, ProfileRow } from "./profileHelpers";

type ObjectiveRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  num_activities: number;
  weightage: number;
  created_at: string;
  updated_at: string;
  created_by: string;
};

function dateInRange(dateStr: string, from?: Date, to?: Date): boolean {
  if (!from && !to) return true;
  const date = new Date(dateStr);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function generateObjectiveSummaryData(dateFrom?: Date, dateTo?: Date, selectedUser?: string) {
  let profileRows: ProfileRow[] = [];
  profileRows = await loadProfiles();

  let objectivesQuery = query(collection(db, "objectives"), orderBy("created_at", "desc"));
  const objectivesSnapshot = await getDocs(objectivesQuery);
  let objectives = objectivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ObjectiveRow }));

  if (selectedUser && selectedUser !== "all-users") {
    objectives = objectives.filter(
      (o: ObjectiveRow) => o.owner_id === selectedUser || o.created_by === selectedUser
    );
  }
  objectives = objectives.filter(
    (o: ObjectiveRow) =>
      dateInRange(o.created_at, dateFrom, dateTo) ||
      dateInRange(o.updated_at, dateFrom, dateTo)
  );

  const data: any[] = [];
  for (const obj of objectives) {
    const updatesQuery = query(
        collection(db, "objective_updates"),
        where("objective_id", "==", obj.id),
        orderBy("update_date", "desc"),
        limit(1)
    );
    const updatesSnapshot = await getDocs(updatesQuery);
    const updates = updatesSnapshot.docs.map(doc => doc.data());
    
    let effectiveProgress = 0;
    let status = "Pending";
    
    if (updates && updates.length > 0) {
      const latestUpdate = updates[0];
      const rawProgress = (latestUpdate.achieved_count / obj.num_activities) * 100;
      const efficiency = latestUpdate.efficiency || 100;
      effectiveProgress = (rawProgress * efficiency) / 100;
      
      if (effectiveProgress >= 100) status = "Completed";
      else if (effectiveProgress > 0) status = "In Progress";
    }
    
    const owner = profileRows.find(p => p.id === obj.owner_id);
    data.push({
      id: obj.id,
      title: obj.title,
      status,
      progress: Math.round(Math.min(100, effectiveProgress)),
      dueDate: new Date(obj.updated_at),
      assignee: findDisplayName(owner),
    });
  }
  return data;
}
