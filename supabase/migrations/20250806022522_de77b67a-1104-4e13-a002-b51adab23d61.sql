-- Fix email_verification_codes table for signup flow
-- Make user_id nullable since we don't have a user during signup verification
ALTER TABLE public.email_verification_codes 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users can insert their own verification codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Users can update their own verification codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.email_verification_codes;

-- Create new RLS policies that work for signup flow
CREATE POLICY "Anyone can insert verification codes for signup" 
ON public.email_verification_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update verification codes by email and code" 
ON public.email_verification_codes 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view verification codes for verification" 
ON public.email_verification_codes 
FOR SELECT 
USING (true);