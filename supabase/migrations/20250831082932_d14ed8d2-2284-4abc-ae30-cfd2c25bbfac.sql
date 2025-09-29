-- Fix the search path for the reset_daily_usage function
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete old daily usage records (older than today)
  DELETE FROM public.daily_usage 
  WHERE usage_date < CURRENT_DATE;
  
  -- This function can be called manually or via a scheduled job
  -- The daily usage will naturally reset by date filtering in the application
END;
$$;