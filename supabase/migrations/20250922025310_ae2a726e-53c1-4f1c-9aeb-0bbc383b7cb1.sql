-- Add missing columns to forgot_password table for OTP functionality
ALTER TABLE public.forgot_password 
ADD COLUMN otp TEXT,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on OTP lookups
CREATE INDEX idx_forgot_password_otp_email ON public.forgot_password(email, otp);
CREATE INDEX idx_forgot_password_expires ON public.forgot_password(expires_at);

-- Add cleanup function to remove expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.forgot_password 
  WHERE expires_at < NOW();
END;
$$;