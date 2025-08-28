
import { db } from "@/integrations/firebase/client";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { loadProfiles, findDisplayName, ProfileRow } from "./profileHelpers";

type ObjectiveUpdateRow = {
  id: string;
  objective_id: string;
  user_id: string;
  achieved_count: number;
  update_date: string;
  created_at: string;
  photos: string[] | null;
  efficiency: number | null;
};

function dateInRange(dateStr: string, from?: Date, to?: Date): boolean {
  if (!from && !to) return true;
  const date = new Date(dateStr);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function generateProgressReportData(dateFrom?: Date, dateTo?: Date, selectedUser?: string) {
  let profileRows: ProfileRow[] = [];
  profileRows = await loadProfiles();

  let updatesQuery = query(collection(db, "objective_updates"), orderBy("update_date", "desc"));
  const updatesSnapshot = await getDocs(updatesQuery);
  let updates = updatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ObjectiveUpdateRow }));

  if (selectedUser && selectedUser !== "all-users") {
    updates = updates.filter(
      (u: ObjectiveUpdateRow) => u.user_id === selectedUser
    );
  }
  updates = updates.filter((u: ObjectiveUpdateRow) =>
    dateInRange(u.update_date, dateFrom, dateTo)
  );
  const data: any[] = [];
  for (const upd of updates) {
    const objDoc = await getDoc(doc(db, "objectives", upd.objective_id));
    const obj = objDoc.exists() ? objDoc.data() : null;

    const user = profileRows.find(p => p.id === upd.user_id);
    
    // Calculate effective completion based on efficiency
    const rawCompletion = obj ? (upd.achieved_count / obj.num_activities) * 100 : 0;
    const efficiency = upd.efficiency || 100;
    const effectiveCompletion = (rawCompletion * efficiency) / 100;
    
    data.push({
      date: new Date(upd.update_date),
      user: findDisplayName(user),
      activity: obj?.title || "-",
      completion: Math.round(Math.min(100, effectiveCompletion)),
      rawCompletion: Math.round(rawCompletion),
      efficiency: efficiency,
      notes: upd.photos && upd.photos.length
        ? `Photos attached (${upd.photos.length}) - Efficiency: ${efficiency}%`
        : `Updated by ${findDisplayName(user)} - Efficiency: ${efficiency}%`
    });
  }
  return data;
}
