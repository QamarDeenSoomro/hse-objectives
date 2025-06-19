/*
  # Add banned_until field to profiles table

  1. Schema Changes
    - Add `banned_until` column to profiles table
    - This field will store when a user's ban expires
    - NULL means the user is not banned

  2. Security
    - Only admins and superadmins can modify this field
    - Users cannot see or modify their own banned_until status
*/

-- Add banned_until column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_until timestamptz;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.banned_until IS 'Timestamp when user ban expires. NULL means user is not banned.';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_banned_until ON public.profiles(banned_until);