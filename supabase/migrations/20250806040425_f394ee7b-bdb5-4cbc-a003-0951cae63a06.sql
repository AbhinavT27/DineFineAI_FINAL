-- Make user_id nullable in email_verification_codes table since OTP verification happens before user creation
ALTER TABLE public.email_verification_codes ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow OTP operations without authenticated user
DROP POLICY IF EXISTS "Anyone can insert verification codes for signup" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Anyone can update verification codes by email and code" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Anyone can view verification codes for verification" ON public.email_verification_codes;

-- Create new policies that allow signup verification without authentication
CREATE POLICY "Allow signup OTP insertion"
ON public.email_verification_codes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow signup OTP verification"
ON public.email_verification_codes
FOR SELECT
USING (true);

CREATE POLICY "Allow signup OTP updates"
ON public.email_verification_codes
FOR UPDATE
USING (true);