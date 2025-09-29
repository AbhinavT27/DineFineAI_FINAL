-- Add security_answer column to profiles table for password reset security
ALTER TABLE public.profiles 
ADD COLUMN security_answer text;