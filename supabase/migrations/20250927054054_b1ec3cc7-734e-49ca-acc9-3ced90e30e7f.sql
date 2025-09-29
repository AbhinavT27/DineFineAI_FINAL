-- Create table for storing AI-generated restaurant menus
CREATE TABLE public.ai_generated_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name TEXT NOT NULL,
  location TEXT NOT NULL,
  menu_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generated_menus ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to menu data
CREATE POLICY "Anyone can view AI generated menus" 
ON public.ai_generated_menus 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create AI generated menus" 
ON public.ai_generated_menus 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update AI generated menus" 
ON public.ai_generated_menus 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_generated_menus_updated_at
BEFORE UPDATE ON public.ai_generated_menus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_ai_generated_menus_restaurant_location 
ON public.ai_generated_menus (restaurant_name, location);