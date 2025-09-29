-- Add missing RLS policy for security_rate_limits table
-- Create policies to allow proper access to rate limiting

CREATE POLICY "Service role can access rate limits for user identification"
ON public.security_rate_limits
FOR SELECT
USING (false); -- Only service role should access this

CREATE POLICY "Service role can manage rate limit records"
ON public.security_rate_limits
FOR INSERT
WITH CHECK (false); -- Only service role should insert/update

CREATE POLICY "Service role can update rate limit records"
ON public.security_rate_limits
FOR UPDATE
USING (false); -- Only service role should update