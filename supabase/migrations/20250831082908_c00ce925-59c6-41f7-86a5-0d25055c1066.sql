-- Function to reset daily usage at start of new day
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete old daily usage records (older than today)
  DELETE FROM public.daily_usage 
  WHERE usage_date < CURRENT_DATE;
  
  -- This function can be called manually or via a scheduled job
  -- The daily usage will naturally reset by date filtering in the application
END;
$$;

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_daily_usage_date_user 
ON public.daily_usage(usage_date, user_id);

-- Update the daily usage fetch logic to ensure proper date handling
-- This will be handled in the application code by always checking for today's date