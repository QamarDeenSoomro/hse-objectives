
// Profile utilities for report generation

import { db } from "@/integrations/firebase/client";
import { collection, getDocs } from "firebase/firestore";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export async function loadProfiles(): Promise<ProfileRow[]> {
  const profilesQuery = collection(db, "profiles");
  const profilesSnapshot = await getDocs(profilesQuery);
  return profilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfileRow));
}

export function findDisplayName(profile?: ProfileRow) {
  return profile?.full_name || profile?.email || "Unknown";
}
