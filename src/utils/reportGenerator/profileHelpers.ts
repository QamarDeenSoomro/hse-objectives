
// Profile utilities for report generation

import { supabase } from "@/integrations/supabase/client";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export async function loadProfiles(): Promise<ProfileRow[]> {
  const { data } = await supabase.from('profiles').select('*');
  return data || [];
}

export function findDisplayName(profile?: ProfileRow) {
  return profile?.full_name || profile?.email || "Unknown";
}
