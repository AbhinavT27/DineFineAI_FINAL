
-- First, let's check if we need to update the user_restaurant_history table structure
-- The table should use user_id and have proper foreign key constraints

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS public.user_restaurant_history CASCADE;

-- Create the user_restaurant_history table with proper structure
CREATE TABLE public.user_restaurant_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  restaurant_data JSONB NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('viewed', 'compared')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own history
ALTER TABLE public.user_restaurant_history ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own history
CREATE POLICY "Users can view their own restaurant history" 
  ON public.user_restaurant_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own history
CREATE POLICY "Users can create their own restaurant history" 
  ON public.user_restaurant_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own history
CREATE POLICY "Users can update their own restaurant history" 
  ON public.user_restaurant_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own history
CREATE POLICY "Users can delete their own restaurant history" 
  ON public.user_restaurant_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance on user queries
CREATE INDEX idx_user_restaurant_history_user_id ON public.user_restaurant_history(user_id, created_at DESC);

-- Create index to prevent duplicate entries for the same restaurant action
CREATE UNIQUE INDEX idx_user_restaurant_history_unique ON public.user_restaurant_history(user_id, restaurant_id, action_type);

-- Also update the search_history table to ensure proper foreign key constraints
DROP TABLE IF EXISTS public.search_history CASCADE;

CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  cuisine_type TEXT,
  price_range TEXT,
  dietary_restrictions TEXT[],
  location TEXT,
  coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for search history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for search history
CREATE POLICY "Users can view their own search history" 
  ON public.search_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" 
  ON public.search_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search history" 
  ON public.search_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" 
  ON public.search_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance on search history queries
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id, created_at DESC);
