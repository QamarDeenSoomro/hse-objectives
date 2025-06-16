
-- Add efficiency column to objective_updates table
ALTER TABLE public.objective_updates 
ADD COLUMN efficiency DECIMAL(5,2) DEFAULT 100.00 CHECK (efficiency >= 0 AND efficiency <= 100);

-- Add comment to explain the column
COMMENT ON COLUMN public.objective_updates.efficiency IS 'Admin-set efficiency percentage (0-100) that multiplies the achieved_count to get actual progress';
