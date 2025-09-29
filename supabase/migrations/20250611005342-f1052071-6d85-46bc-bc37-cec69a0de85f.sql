
-- Create a table for user-created tags
CREATE TABLE public.user_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  tag_name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue color
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_name) -- Prevent duplicate tag names per user
);

-- Create a table for restaurant-tag associations
CREATE TABLE public.restaurant_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  restaurant_id TEXT NOT NULL,
  tag_id UUID REFERENCES public.user_tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id, tag_id) -- Prevent duplicate tag assignments
);

-- Create a table for app feedback
CREATE TABLE public.app_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature_request', 'general', 'ai_quality')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_tags
CREATE POLICY "Users can view their own tags" 
  ON public.user_tags 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
  ON public.user_tags 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
  ON public.user_tags 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
  ON public.user_tags 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for restaurant_tags
CREATE POLICY "Users can view their own restaurant tags" 
  ON public.restaurant_tags 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own restaurant tags" 
  ON public.restaurant_tags 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurant tags" 
  ON public.restaurant_tags 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for app_feedback
CREATE POLICY "Users can view their own feedback" 
  ON public.app_feedback 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" 
  ON public.app_feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL); -- Allow anonymous feedback

CREATE POLICY "Users can update their own feedback" 
  ON public.app_feedback 
  FOR UPDATE 
  USING (auth.uid() = user_id);
