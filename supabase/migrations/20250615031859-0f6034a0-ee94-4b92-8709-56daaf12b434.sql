
-- Create a table for user restaurant history
CREATE TABLE public.user_restaurant_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id TEXT NOT NULL,
  restaurant_data JSONB NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('viewed', 'compared')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own history
ALTER TABLE public.user_restaurant_history ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own history
CREATE POLICY "Users can view their own history" 
  ON public.user_restaurant_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own history
CREATE POLICY "Users can create their own history" 
  ON public.user_restaurant_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own history
CREATE POLICY "Users can delete their own history" 
  ON public.user_restaurant_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance on user queries
CREATE INDEX idx_user_restaurant_history_user_id ON public.user_restaurant_history(user_id, created_at DESC);

-- Create index to prevent duplicate entries for the same restaurant action
CREATE UNIQUE INDEX idx_user_restaurant_history_unique ON public.user_restaurant_history(user_id, restaurant_id, action_type);
