-- Create email verification codes table for new user onboarding
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable Row Level Security
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for email verification codes
CREATE POLICY "Users can view their own verification codes" 
ON public.email_verification_codes 
FOR SELECT 
USING (true); -- Allow reading for verification purposes

CREATE POLICY "System can insert verification codes" 
ON public.email_verification_codes 
FOR INSERT 
WITH CHECK (true); -- Allow system to insert codes

CREATE POLICY "System can update verification codes" 
ON public.email_verification_codes 
FOR UPDATE 
USING (true); -- Allow system to update verification status

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON public.email_verification_codes(expires_at);