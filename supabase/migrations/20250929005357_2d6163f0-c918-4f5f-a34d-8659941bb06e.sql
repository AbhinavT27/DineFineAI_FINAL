-- Add trial_history column to track if user has ever had a trial
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_history jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the trial_history column
COMMENT ON COLUMN public.subscribers.trial_history IS 'JSON array tracking all trial periods user has had, format: [{"plan": "pro", "start": "2023-01-01", "end": "2023-01-08", "status": "completed"}]';