-- Create the trigger to automatically populate profiles when users sign up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add RLS policy to allow username lookup during authentication
-- This is needed so the auth system can find users by username
CREATE POLICY "Allow username lookup for authentication" 
ON public.profiles 
FOR SELECT 
USING (true);