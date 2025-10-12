-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to reset daily search requests at midnight UTC
CREATE OR REPLACE FUNCTION reset_daily_search_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset daily_searchrequests to 0 for users whose last reset was before today (UTC)
  UPDATE profiles
  SET 
    daily_searchrequests = 0,
    last_search_reset_date = CURRENT_DATE
  WHERE last_search_reset_date < CURRENT_DATE;
  
  RAISE NOTICE 'Daily search requests reset completed at % UTC', NOW();
END;
$$;

-- Schedule the function to run daily at midnight UTC (5 PM PST)
-- This runs at 00:00:00 UTC every day
SELECT cron.schedule(
  'reset-daily-searches',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT reset_daily_search_requests();
  $$
);

-- Also run it immediately to reset any stale counts
SELECT reset_daily_search_requests();