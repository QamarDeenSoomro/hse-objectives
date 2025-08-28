import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { loadProfiles, findDisplayName, ProfileRow } from "./profileHelpers";

type ActionItemRow = {
  id: string;
  title: string;
  description: string | null;
  target_date: string;
  priority: string;
  status: string;
  assigned_to: string;
  verifier_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  verified_at: string | null;
};

type ActionItemClosureRow = {
  id: string;
  action_item_id: string;
  closure_text: string;
  media_urls: string[] | null;
  closed_by: string;
  created_at: string;
};

type ActionItemVerificationRow = {
  id: string;
  action_item_id: string;
  verification_status: string;
  verification_comments: string | null;
  verified_by: string;
  created_at: string;
};

function dateInRange(dateStr: string, from?: Date, to?: Date): boolean {
  if (!from && !to) return true;
  const date = new Date(dateStr);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function generateActionItemsReportData(dateFrom?: Date, dateTo?: Date, selectedUser?: string) {
  let profileRows: ProfileRow[] = [];
  profileRows = await loadProfiles();

  const actionItemsQuery = query(collection(db, "action_items"), orderBy("created_at", "desc"));
  const actionItemsSnapshot = await getDocs(actionItemsQuery);
  let actionItems = actionItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ActionItemRow }));

  const closuresQuery = query(collection(db, "action_item_closures"));
  const closuresSnapshot = await getDocs(closuresQuery);
  let closures = closuresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ActionItemClosureRow }));

  const verificationsQuery = query(collection(db, "action_item_verifications"));
  const verificationsSnapshot = await getDocs(verificationsQuery);
  let verifications = verificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as ActionItemVerificationRow }));

  // Apply date filtering
  if (dateFrom || dateTo) {
    actionItems = actionItems.filter(
      (item: ActionItemRow) =>
        dateInRange(item.created_at, dateFrom, dateTo) ||
        dateInRange(item.updated_at, dateFrom, dateTo) ||
        (item.closed_at && dateInRange(item.closed_at, dateFrom, dateTo)) ||
        (item.verified_at && dateInRange(item.verified_at, dateFrom, dateTo))
    );
  }

  // Apply user filtering
  if (selectedUser && selectedUser !== "all-users") {
    actionItems = actionItems.filter(
      (item: ActionItemRow) => 
        item.assigned_to === selectedUser || 
        item.verifier_id === selectedUser || 
        item.created_by === selectedUser
    );
  }

  const data: any[] = [];

  for (const item of actionItems) {
    const assignedUser = profileRows.find(p => p.id === item.assigned_to);
    const verifier = profileRows.find(p => p.id === item.verifier_id);
    const creator = profileRows.find(p => p.id === item.created_by);
    
    const closure = closures.find((c: ActionItemClosureRow) => c.action_item_id === item.id);
    const verification = verifications.find((v: ActionItemVerificationRow) => v.action_item_id === item.id);
    
    const isOverdue = new Date(item.target_date) < new Date() && item.status === 'open';

    data.push({
      id: item.id,
      title: item.title,
      description: item.description || '',
      target_date: new Date(item.target_date),
      priority: item.priority.toUpperCase(),
      status: item.status.replace('_', ' ').toUpperCase(),
      assigned_to: findDisplayName(assignedUser),
      verifier: verifier ? findDisplayName(verifier) : 'None',
      created_by: findDisplayName(creator),
      created_at: new Date(item.created_at),
      closed_at: item.closed_at ? new Date(item.closed_at) : null,
      verified_at: item.verified_at ? new Date(item.verified_at) : null,
      closure_text: closure?.closure_text || '',
      verification_status: verification?.verification_status?.toUpperCase() || '',
      verification_comments: verification?.verification_comments || '',
      is_overdue: isOverdue ? 'YES' : 'NO',
      days_to_target: Math.ceil((new Date(item.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    });
  }

  return data;
}