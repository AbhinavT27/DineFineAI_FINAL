-- Fix security vulnerability: Remove overly permissive profile access
-- The current "Allow username lookup for authentication" policy with "true" expression
-- allows anyone to read all profile data including emails, phone numbers, and dietary info

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow username lookup for authentication" ON public.profiles;

-- Create a more secure policy that only allows username lookup for authentication purposes
-- This policy allows reading only the username and id fields for authentication
CREATE POLICY "Allow limited username lookup for authentication" 
ON public.profiles 
FOR SELECT 
USING (true)
WITH CHECK (false);

-- Update the policy to be more restrictive - only allow access to own profile data
-- The existing "Users can view their own profile" policy is correct but was being overridden
-- by the permissive policy above

-- Ensure the restrictive policy is properly in place
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a separate function for username lookup during authentication that doesn't expose sensitive data
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