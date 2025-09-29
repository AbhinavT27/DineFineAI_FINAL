-- Phase 1: Critical Data Exposure Fixes
-- Fix RLS policies for sensitive tables

-- Drop the overly permissive policies on email_verification_codes
DROP POLICY IF EXISTS "Allow signup OTP insertion" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Allow signup OTP updates" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Allow signup OTP verification" ON public.email_verification_codes;

-- Create secure RLS policies for email_verification_codes
CREATE POLICY "Service role can manage email verification codes"
ON public.email_verification_codes
FOR ALL
USING (false); -- Only service role can access

CREATE POLICY "Users can access their own verification codes"
ON public.email_verification_codes
FOR SELECT
USING (auth.uid()::text = user_id::text OR auth.email() = email);

-- Drop the overly permissive policies on forgot_password
DROP POLICY IF EXISTS "Anyone can insert forgot password attempts" ON public.forgot_password;
DROP POLICY IF EXISTS "Users can view their own forgot password attempts" ON public.forgot_password;

-- Create secure RLS policies for forgot_password
CREATE POLICY "Service role can manage forgot password attempts"
ON public.forgot_password
FOR ALL
USING (false); -- Only service role can access

CREATE POLICY "Users can access their own forgot password attempts"
ON public.forgot_password
FOR SELECT
USING (auth.uid() = user_id OR auth.email() = email);

-- Add rate limiting table for security
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or email
  action_type TEXT NOT NULL, -- 'login', 'password_reset', 'signup'
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.security_rate_limits
FOR ALL
USING (false);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_rate_limits_identifier_action 
ON public.security_rate_limits(identifier, action_type);

CREATE INDEX IF NOT EXISTS idx_security_rate_limits_blocked_until 
ON public.security_rate_limits(blocked_until) 
WHERE blocked_until IS NOT NULL;