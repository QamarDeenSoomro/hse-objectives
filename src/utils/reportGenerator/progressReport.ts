
import { supabase } from "@/integrations/supabase/client";
import { loadProfiles, findDisplayName, ProfileRow } from "./profileHelpers";

type ObjectiveUpdateRow = {
  id: string;
  objective_id: string;
  user_id: string;
  achieved_count: number;
  update_date: string;
  created_at: string;
  photos: string[] | null;
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
  let { data: updates_ } = await supabase
    .from('objective_updates')
    .select('*')
    .order('update_date', { ascending: false });
  let updates = updates_ || [];
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
    let { data: obj } = await supabase
      .from('objectives')
      .select('title')
      .eq('id', upd.objective_id)
      .maybeSingle();
    const user = profileRows.find(p => p.id === upd.user_id);
    data.push({
      date: new Date(upd.update_date),
      user: findDisplayName(user),
      activity: obj?.title || "-",
      completion: upd.achieved_count,
      notes: upd.photos && upd.photos.length
        ? `Photos attached (${upd.photos.length})`
        : `Updated by ${findDisplayName(user)}`
    });
  }
  return data;
}
