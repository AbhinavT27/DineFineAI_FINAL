-- Add feedback_requests column to daily_usage table
ALTER TABLE public.daily_usage 
ADD COLUMN feedback_requests integer NOT NULL DEFAULT 0;