/*
  # Add target completion date to objectives

  1. Schema Changes
    - Add `target_completion_date` column to objectives table
    - Set default value to Q4 2025 (December 31, 2025)
    - Add constraint to ensure valid dates

  2. Data Migration
    - Update existing objectives to have Q4 2025 as default target date
*/

-- Add target_completion_date column to objectives table
ALTER TABLE public.objectives 
ADD COLUMN target_completion_date DATE DEFAULT '2025-12-31';

-- Add comment to explain the column
COMMENT ON COLUMN public.objectives.target_completion_date IS 'Target completion date for the objective (typically end of quarter: Q1=Mar 31, Q2=Jun 30, Q3=Sep 30, Q4=Dec 31)';

-- Update existing objectives to have Q4 2025 as default
UPDATE public.objectives 
SET target_completion_date = '2025-12-31' 
WHERE target_completion_date IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.objectives 
ALTER COLUMN target_completion_date SET NOT NULL;