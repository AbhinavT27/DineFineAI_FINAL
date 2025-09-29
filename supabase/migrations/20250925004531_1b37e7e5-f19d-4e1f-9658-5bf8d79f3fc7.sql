-- Add search_requests column to daily_usage table
ALTER TABLE public.daily_usage 
ADD COLUMN search_requests integer NOT NULL DEFAULT 0;