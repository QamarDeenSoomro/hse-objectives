
import { supabase } from "@/integrations/supabase/client";
import { loadProfiles, findDisplayName, ProfileRow } from "./profileHelpers";

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

export async function generateDailyWorkSummaryData(dateFrom?: Date, dateTo?: Date, selectedUser?: string) {
  let profileRows: ProfileRow[] = [];
  profileRows = await loadProfiles();
  let { data: works_ } = await supabase
    .from('daily_work')
    .select('*')
    .order('work_date', { ascending: false });
  let works = works_ || [];
  if (selectedUser && selectedUser !== "all-users") {
    works = works.filter((w: DailyWorkRow) => w.user_id === selectedUser);
  }
  works = works.filter((w: DailyWorkRow) =>
    dateInRange(w.work_date, dateFrom, dateTo)
  );
  const data: any[] = [];
  for (const w of works) {
    const user = profileRows.find(p => p.id === w.user_id);
    data.push({
      date: new Date(w.work_date),
      user: findDisplayName(user),
      work_description: w.work_description,
      admin_comments: w.admin_comments || "",
      created_at: new Date(w.created_at)
    });
  }
  return data;
}
