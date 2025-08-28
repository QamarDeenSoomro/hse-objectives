
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
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

type ObjectiveUpdateRow = {
  id: string;
  objective_id: string;
  user_id: string;
  achieved_count: number;
  update_date: string;
  created_at: string;
  photos: string[] | null;
};

type DailyWorkRow = {
  id: string;
  user_id: string;
  work_date: string;
  work_description: string;
  created_at: string;
  updated_at: string;
  admin_comments: string | null;
};

function dateInRange(dateStr: string, from?: Date, to?: Date): boolean {
  if (!from && !to) return true;
  const date = new Date(dateStr);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function generateActivityTimelineData(dateFrom?: Date, dateTo?: Date, selectedUser?: string) {
  let profileRows: ProfileRow[] = [];
  profileRows = await loadProfiles();

  const objectivesQuery = query(collection(db, "objectives"), orderBy("created_at", "desc"));
  const objectivesSnapshot = await getDocs(objectivesQuery);
  let objectives = objectivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ObjectiveRow }));

  const updatesQuery = query(collection(db, "objective_updates"), orderBy("update_date", "desc"));
  const updatesSnapshot = await getDocs(updatesQuery);
  let updates = updatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ObjectiveUpdateRow }));

  const worksQuery = query(collection(db, "daily_work"), orderBy("work_date", "desc"));
  const worksSnapshot = await getDocs(worksQuery);
  let works = worksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as DailyWorkRow }));

  if (dateFrom || dateTo) {
    objectives = objectives.filter(
      (o: ObjectiveRow) =>
        dateInRange(o.created_at, dateFrom, dateTo) ||
        dateInRange(o.updated_at, dateFrom, dateTo)
    );
    updates = updates.filter(
      (u: ObjectiveUpdateRow) => dateInRange(u.update_date, dateFrom, dateTo)
    );
    works = works.filter(
      (w: DailyWorkRow) => dateInRange(w.work_date, dateFrom, dateTo)
    );
  }
  if (selectedUser && selectedUser !== "all-users") {
    objectives = objectives.filter(
      (o: ObjectiveRow) => o.owner_id === selectedUser || o.created_by === selectedUser
    );
    updates = updates.filter(
      (u: ObjectiveUpdateRow) => u.user_id === selectedUser
    );
    works = works.filter(
      (w: DailyWorkRow) => w.user_id === selectedUser
    );
  }
  const data: any[] = [];
  for (const o of objectives) {
    const owner = profileRows.find(p => p.id === o.owner_id);
    data.push({
      date: new Date(o.created_at),
      type: "Objective",
      desc: `Objective "${o.title}" created`,
      user: findDisplayName(owner)
    });
  }
  for (const u of updates) {
    const user = profileRows.find(p => p.id === u.user_id);
    data.push({
      date: new Date(u.update_date),
      type: "Update",
      desc: `Objective update: achieved ${u.achieved_count}%`,
      user: findDisplayName(user)
    });
  }
  for (const w of works) {
    const user = profileRows.find(p => p.id === w.user_id);
    data.push({
      date: new Date(w.work_date),
      type: "Daily Work",
      desc: w.work_description,
      user: findDisplayName(user)
    });
  }
  data.sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());
  return data;
}
