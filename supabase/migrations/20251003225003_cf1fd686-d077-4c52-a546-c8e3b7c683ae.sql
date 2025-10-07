-- Add daily search tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN daily_searchrequests integer NOT NULL DEFAULT 0,
ADD COLUMN last_search_reset_date date NOT NULL DEFAULT CURRENT_DATE;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.daily_searchrequests IS 'Number of search requests made today (resets at midnight PST)';
COMMENT ON COLUMN public.profiles.last_search_reset_date IS 'Last date when search requests were reset (PST timezone)';