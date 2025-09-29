
-- Create a table for tagged restaurants (separate from restaurant_tags for better organization)
CREATE TABLE public.tagged_restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id TEXT NOT NULL,
  restaurant_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.tagged_restaurants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tagged_restaurants
CREATE POLICY "Users can view their own tagged restaurants" 
  ON public.tagged_restaurants 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tagged restaurants" 
  ON public.tagged_restaurants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tagged restaurants" 
  ON public.tagged_restaurants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tagged restaurants" 
  ON public.tagged_restaurants 
  FOR DELETE 
  USING (auth.uid() = user_id);
