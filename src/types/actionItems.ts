export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  target_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'closed' | 'pending_verification' | 'verified';
  assigned_to: string;
  verifier_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  verified_at?: string;
  assigned_user?: {
    full_name: string;
    email: string;
  };
  verifier?: {
    full_name: string;
    email: string;
  };
  creator?: {
    full_name: string;
    email: string;
  };
  closure?: ActionItemClosure;
  verification?: ActionItemVerification;
}

export interface ActionItemClosure {
  id: string;
  action_item_id: string;
  closure_text: string;
  media_urls?: string[];
  closed_by: string;
  created_at: string;
  closer?: {
    full_name: string;
    email: string;
  };
}

export interface ActionItemVerification {
  id: string;
  action_item_id: string;
  verification_status: 'approved' | 'rejected';
  verification_comments?: string;
  verified_by: string;
  created_at: string;
  verifier?: {
    full_name: string;
    email: string;
  };
}

export interface ActionItemFormData {
  title: string;
  description: string;
  target_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string;
  verifier_id: string;
}

export interface ActionItemClosureFormData {
  closure_text: string;
  media_files: File[];
}

export interface ActionItemVerificationFormData {
  verification_status: 'approved' | 'rejected';
  verification_comments: string;
}

export const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS = {
  open: 'bg-gray-100 text-gray-800',
  closed: 'bg-blue-100 text-blue-800',
  pending_verification: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
};

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];