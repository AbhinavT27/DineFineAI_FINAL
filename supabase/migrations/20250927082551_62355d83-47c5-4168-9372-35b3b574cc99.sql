-- Fix function search path warning by ensuring all functions have proper search_path setting
-- Update existing function to have proper search_path
CREATE OR REPLACE FUNCTION public.detect_and_translate_search_query(user_input text)
RETURNS TABLE(original_text text, detected_language text, translated_text text, confidence numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- This is a placeholder function that will be implemented with OpenAI
  -- For now, return the original input
  RETURN QUERY
  SELECT 
    user_input as original_text,
    'en'::TEXT as detected_language,
    user_input as translated_text,
    1.0::DECIMAL as confidence;
END;
$function$;

-- Add RLS policies for tables that have RLS enabled but no policies
-- For menus table (if needed for public access)
CREATE POLICY "Anyone can view menus" 
ON public.menus 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create menus" 
ON public.menus 
FOR INSERT 
WITH CHECK (true);

-- For restaurants table (if needed for public access)
CREATE POLICY "Anyone can view restaurants" 
ON public.restaurants 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (true);

-- For python_scraper_restaurants table (if needed for public access)
CREATE POLICY "Anyone can view python_scraper_restaurants" 
ON public.python_scraper_restaurants 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create python_scraper_restaurants" 
ON public.python_scraper_restaurants 
FOR INSERT 
WITH CHECK (true);

-- For user_search_restaurants table (if needed for public access)
CREATE POLICY "Anyone can view user_search_restaurants" 
ON public.user_search_restaurants 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create user_search_restaurants" 
ON public.user_search_restaurants 
FOR INSERT 
WITH CHECK (true);