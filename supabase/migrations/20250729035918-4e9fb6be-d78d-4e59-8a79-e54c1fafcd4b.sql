-- Add RLS policy to allow username lookup during authentication
-- This is needed so the auth system can find users by username
CREATE POLICY "Allow username lookup for authentication" 
ON public.profiles 
FOR SELECT 
USING (true);