
-- Create a table for storing menu analysis results
CREATE TABLE public.menu_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL UNIQUE,
  restaurant_name TEXT NOT NULL,
  restaurant_website TEXT NOT NULL,
  menu_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  scraped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to the menu_analysis table
ALTER TABLE public.menu_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to read menu analysis (public data)
CREATE POLICY "Anyone can view menu analysis" 
  ON public.menu_analysis 
  FOR SELECT 
  USING (true);

-- Create policy that allows the service role to insert/update menu analysis
CREATE POLICY "Service role can manage menu analysis" 
  ON public.menu_analysis 
  FOR ALL 
  USING (true);

-- Create index for faster lookups by restaurant_id
CREATE INDEX idx_menu_analysis_restaurant_id ON public.menu_analysis(restaurant_id);

-- Create index for faster lookups by website
CREATE INDEX idx_menu_analysis_website ON public.menu_analysis(restaurant_website);
