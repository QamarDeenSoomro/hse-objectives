
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from "@/integrations/supabase/client";

export interface ReportData {
  type: string;
  dateFrom?: Date;
  dateTo?: Date;
  user?: string;
  data: any[];
}

export const generateCSV = (reportData: ReportData): string => {
  const { data } = reportData;
  
  if (!data || data.length === 0) {
    return 'No data available';
  }
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => {
      if (value instanceof Date) {
        return `"${value.toLocaleDateString()}"`;
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

export const generatePDF = (reportData: ReportData): jsPDF => {
  const { type, dateFrom, dateTo, data } = reportData;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('HSE Report', 20, 20);
  
  // Add report details
  doc.setFontSize(12);
  doc.text(`Report Type: ${type.replace(/-/g, ' ').toUpperCase()}`, 20, 35);
  
  if (dateFrom && dateTo) {
    doc.text(`Period: ${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`, 20, 45);
  }
  
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
  
  // Add table data
  if (data && data.length > 0) {
    const tableData = data.map(row => Object.values(row).map(value => {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return String(value);
    }));
    
    const tableHeaders = Object.keys(data[0]).map(header => 
      header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    );
    
    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 70,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
  }
  
  return doc;
};

export const downloadFile = (content: string | jsPDF, filename: string, type: 'csv' | 'pdf') => {
  if (type === 'pdf' && content instanceof jsPDF) {
    content.save(filename);
    return;
  }
  
  if (type === 'csv' && typeof content === 'string') {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
};

type ObjectiveRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  num_activities: number;
  weightage: number;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
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

function findDisplayName(profile: ProfileRow | undefined) {
  return profile?.full_name || profile?.email || "Unknown";
}

export const generateReportData = async (
  reportType: string, 
  dateFrom?: Date, 
  dateTo?: Date, 
  selectedUser?: string
): Promise<ReportData> => {
  // Data caching for all profiles for name reference (avoids repeat queries).
  let profileRows: ProfileRow[] = [];
  const loadProfiles = async () => {
    if (profileRows.length) return;
    const { data } = await supabase
      .from('profiles')
      .select('*');
    profileRows = data || [];
  }

  let data: any[] = [];

  // Only fetch and filter actual relevant data
  switch (reportType) {
    case 'objectives-summary':
      {
        // Load objectives and owner profiles
        await loadProfiles();
        let { data: objectives } = await supabase
          .from('objectives')
          .select('*')
          .order('created_at', { ascending: false });
        if (!objectives) objectives = [];
        // If user selected, filter by objectives they own or created
        if (selectedUser && selectedUser !== "all-users") {
          objectives = objectives.filter(
            (o: ObjectiveRow) => o.owner_id === selectedUser || o.created_by === selectedUser
          );
        }
        // Filter by date
        objectives = objectives.filter(
          (o: ObjectiveRow) =>
            dateInRange(o.created_at, dateFrom, dateTo) ||
            dateInRange(o.updated_at, dateFrom, dateTo)
        );

        // For progress and status, find latest update (objective_updates) for each
        for (const obj of objectives) {
          // Get latest update for progress & status
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
      }
      break;

    case 'progress-report':
      {
        // List of updates (activity)
        await loadProfiles();
        let { data: updates } = await supabase
          .from('objective_updates')
          .select('*')
          .order('update_date', { ascending: false });
        if (!updates) updates = [];
        if (selectedUser && selectedUser !== "all-users") {
          updates = updates.filter(
            (u: ObjectiveUpdateRow) => u.user_id === selectedUser
          );
        }
        updates = updates.filter((u: ObjectiveUpdateRow) =>
          dateInRange(u.update_date, dateFrom, dateTo)
        );

        // Get objective title for each update
        for (const upd of updates) {
          let { data: obj } = await supabase
            .from('objectives')
            .select('title')
            .eq('id', upd.objective_id)
            .maybeSingle();
          const user = profileRows.find(p => p.id === upd.user_id);

          data.push({
            date: new Date(upd.update_date),
            activity: obj?.title || "-",
            completion: upd.achieved_count,
            notes: upd.photos && upd.photos.length
              ? `Photos attached (${upd.photos.length})`
              : `Updated by ${findDisplayName(user)}`
          });
        }
      }
      break;

    case 'team-performance':
      {
        // For each user, aggregate performance over objectives
        await loadProfiles();
        // Only relevant users (filtered or all)
        let relevantUsers = profileRows;
        if (selectedUser && selectedUser !== "all-users") {
          relevantUsers = profileRows.filter(u => u.id === selectedUser);
        }
        // Gather stats on objectives per user
        for (const user of relevantUsers) {
          // Find objectives "owned" by user
          let { data: objectives } = await supabase
            .from('objectives')
            .select('id')
            .eq('owner_id', user.id);
          objectives = objectives || [];
          let completedObjectives = 0, pendingObjectives = 0;
          let lastActivityDate: Date | null = null;

          for (const o of objectives) {
            // Find updates for the objective
            const { data: updates } = await supabase
              .from('objective_updates')
              .select('achieved_count, update_date')
              .eq('objective_id', o.id)
              .order('update_date', { ascending: false });

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
          // Efficiency = ratio of completed to total
          const total = (objectives?.length || 0);
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
      }
      break;

    case 'daily-work-summary':
      {
        // Load daily work entries
        await loadProfiles();
        let { data: works } = await supabase
          .from('daily_work')
          .select('*')
          .order('work_date', { ascending: false });
        works = works || [];
        if (selectedUser && selectedUser !== "all-users") {
          works = works.filter((w: DailyWorkRow) => w.user_id === selectedUser);
        }
        works = works.filter((w: DailyWorkRow) =>
          dateInRange(w.work_date, dateFrom, dateTo)
        );

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
      }
      break;

    case 'activity-timeline':
      {
        // Show chronological events: objectives created/updated + major updates + daily work
        await loadProfiles();
        let { data: objectives } = await supabase
          .from('objectives')
          .select('*')
          .order('created_at', { ascending: false });
        let { data: updates } = await supabase
          .from('objective_updates')
          .select('*')
          .order('update_date', { ascending: false });
        let { data: works } = await supabase
          .from('daily_work')
          .select('*')
          .order('work_date', { ascending: false });

        objectives = objectives || [];
        updates = updates || [];
        works = works || [];

        // Filter by date
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
        // by user
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

        // Build timeline items
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
        // Order chronologically descending (latest first)
        data.sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());
      }
      break;

    default:
      data = [{ message: 'No data available for this report type' }];
  }
  
  // Artificial wait for UI consistency (loading spinner)
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    type: reportType,
    dateFrom,
    dateTo,
    user: selectedUser,
    data
  };
};
