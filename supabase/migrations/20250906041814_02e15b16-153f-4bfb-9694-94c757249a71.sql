-- Fix RLS policies for app_feedback table
DROP POLICY IF EXISTS "Users can create feedback" ON public.app_feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.app_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.app_feedback;

-- Create correct RLS policies for app_feedback
CREATE POLICY "Users can create feedback" 
ON public.app_feedback 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL)
);

CREATE POLICY "Users can view their own feedback" 
ON public.app_feedback 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL)
);

CREATE POLICY "Users can update their own feedback" 
ON public.app_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);