-- Fix security vulnerability: Remove overly permissive profile access
-- The current "Allow username lookup for authentication" policy with "true" expression
-- allows anyone to read all profile data including emails, phone numbers, and dietary info

-- Drop the overly permissive policy that allows anyone to read all profile data
DROP POLICY IF EXISTS "Allow username lookup for authentication" ON public.profiles;

-- Ensure only the restrictive policy remains - users can only view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a secure function for username lookup during authentication
-- This function only exposes username and id, protecting sensitive data
CREATE OR REPLACE FUNCTION public.lookup_username_for_auth(input_username text)
RETURNS TABLE(id uuid, username text) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id, p.username 
  FROM public.profiles p 
  WHERE p.username = input_username
  LIMIT 1;
$$;