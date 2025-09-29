-- Drop existing conflicting policies first and recreate them properly
DROP POLICY IF EXISTS "Anyone can view menus" ON public.menus;
DROP POLICY IF EXISTS "Anyone can create menus" ON public.menus;
DROP POLICY IF EXISTS "Anyone can view restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Anyone can create restaurants" ON public.restaurants;

-- For menus table (public access needed for menu functionality)
CREATE POLICY "Public read access for menus" 
ON public.menus 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for menus" 
ON public.menus 
FOR INSERT 
WITH CHECK (true);

-- For restaurants table (public access for restaurant data)
CREATE POLICY "Public read access for restaurants" 
ON public.restaurants 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (true);

-- For python_scraper_restaurants (public access for scraping functionality)
CREATE POLICY "Public read access for python_scraper_restaurants" 
ON public.python_scraper_restaurants 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for python_scraper_restaurants" 
ON public.python_scraper_restaurants 
FOR INSERT 
WITH CHECK (true);

-- For user_search_restaurants (public access for search functionality)
CREATE POLICY "Public read access for user_search_restaurants" 
ON public.user_search_restaurants 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for user_search_restaurants" 
ON public.user_search_restaurants 
FOR INSERT 
WITH CHECK (true);