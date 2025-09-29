-- Fix RLS policies with proper type casting

-- Add INSERT policy for forgot_password table (for service role/edge functions)
DROP POLICY IF EXISTS "Service role can manage forgot password attempts" ON public.forgot_password;
CREATE POLICY "Service role can insert and manage forgot password attempts"
ON public.forgot_password
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add INSERT policy for authenticated users on forgot_password
CREATE POLICY "Users can insert forgot password requests"
ON public.forgot_password
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add policies for python_scraper_restaurants table
CREATE POLICY "Public read access for python_scraper_restaurants"
ON public.python_scraper_restaurants
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage python_scraper_restaurants"
ON public.python_scraper_restaurants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add policies for restaurants table
CREATE POLICY "Public read access for restaurants"
ON public.restaurants
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage restaurants"
ON public.restaurants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add policies for user_search_restaurants table (with proper type casting)
CREATE POLICY "Users can view their own search restaurants"
ON public.user_search_restaurants
FOR SELECT
USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own search restaurants"
ON public.user_search_restaurants
FOR INSERT
WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Service role can manage user_search_restaurants"
ON public.user_search_restaurants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);