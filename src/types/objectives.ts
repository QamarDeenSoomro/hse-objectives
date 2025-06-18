export interface Objective {
  id: string;
  title: string;
  description: string;
  weightage: number;
  num_activities: number;
  owner_id: string;
  created_by: string;
  created_at: string;
  target_completion_date: string;
  owner?: {
    full_name: string;
    email: string;
  };
  creator?: {
    full_name: string;
    email: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

export interface ObjectiveFormData {
  title: string;
  description: string;
  weightage: string;
  numActivities: string;
  ownerId: string;
  targetQuarter: string;
}

export interface QuarterOption {
  value: string;
  label: string;
}