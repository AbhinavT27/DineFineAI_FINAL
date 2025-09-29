-- Create a helper function to allow logging in with a username by securely resolving the user's email
-- SECURITY NOTE: SECURITY DEFINER allows this function to bypass RLS on public.profiles for the lookup only
-- It returns only the email for the provided username
CREATE OR REPLACE FUNCTION public.lookup_email_for_username(input_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.profiles
  WHERE username = input_username
  LIMIT 1;
$$;