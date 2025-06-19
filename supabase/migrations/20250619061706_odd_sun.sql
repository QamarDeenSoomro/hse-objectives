/*
  # Add banned_until column to profiles table

  1. Schema Changes
    - Add `banned_until` column to profiles table to track user ban status
    - This will help the UI show proper status for disabled users

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

-- Add banned_until column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_until timestamptz;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.banned_until IS 'Timestamp until which the user is banned/disabled. NULL means user is active.';