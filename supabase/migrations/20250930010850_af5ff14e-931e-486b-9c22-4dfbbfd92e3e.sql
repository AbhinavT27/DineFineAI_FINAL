-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup function to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-expired-history-daily',
  '0 2 * * *', -- Daily at 2 AM UTC
  'SELECT public.cleanup_expired_history();'
);