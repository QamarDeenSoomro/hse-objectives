
import { supabase } from "@/integrations/supabase/client";
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
  let { data: objectives_ } = await supabase
    .from('objectives')
    .select('*')
    .order('created_at', { ascending: false });
  let { data: updates_ } = await supabase
    .from('objective_updates')
    .select('*')
    .order('update_date', { ascending: false });
  let { data: works_ } = await supabase
    .from('daily_work')
    .select('*')
    .order('work_date', { ascending: false });

  let objectives = objectives_ || [];
  let updates = updates_ || [];
  let works = works_ || [];

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
