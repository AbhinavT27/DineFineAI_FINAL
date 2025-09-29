-- Fix RLS policies for search_history table
DROP POLICY IF EXISTS "Users can create their own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can view their own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can delete their own search history" ON public.search_history;

CREATE POLICY "Users can create their own search history" 
ON public.search_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own search history" 
ON public.search_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" 
ON public.search_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for user_restaurant_history table
DROP POLICY IF EXISTS "Users can create their own restaurant history" ON public.user_restaurant_history;
DROP POLICY IF EXISTS "Users can view their own restaurant history" ON public.user_restaurant_history;
DROP POLICY IF EXISTS "Users can update their own restaurant history" ON public.user_restaurant_history;
DROP POLICY IF EXISTS "Users can delete their own restaurant history" ON public.user_restaurant_history;

CREATE POLICY "Users can create their own restaurant history" 
ON public.user_restaurant_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own restaurant history" 
ON public.user_restaurant_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant history" 
ON public.user_restaurant_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurant history" 
ON public.user_restaurant_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for comparison_history table
DROP POLICY IF EXISTS "Users can create their own comparison history" ON public.comparison_history;
DROP POLICY IF EXISTS "Users can view their own comparison history" ON public.comparison_history;
DROP POLICY IF EXISTS "Users can delete their own comparison history" ON public.comparison_history;

CREATE POLICY "Users can create their own comparison history" 
ON public.comparison_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own comparison history" 
ON public.comparison_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comparison history" 
ON public.comparison_history 
FOR DELETE 
USING (auth.uid() = user_id);