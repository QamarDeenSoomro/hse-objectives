
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
  let { data: objectives_ } = await supabase
    .from('objectives')
    .select('*')
    .order('created_at', { ascending: false });

  let objectives = objectives_ || [];
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
    const { data: updates } = await supabase
      .from('objective_updates')
      .select('*')
      .eq('objective_id', obj.id)
      .order('update_date', { ascending: false })
      .limit(1);
    let progress = 0;
    let status = "Pending";
    if (updates && updates.length > 0) {
      progress = updates[0].achieved_count;
      if (progress >= 100) status = "Completed";
      else if (progress > 0) status = "In Progress";
    }
    const owner = profileRows.find(p => p.id === obj.owner_id);
    data.push({
      id: obj.id,
      title: obj.title,
      status,
      progress,
      dueDate: new Date(obj.updated_at),
      assignee: findDisplayName(owner),
    });
  }
  return data;
}
