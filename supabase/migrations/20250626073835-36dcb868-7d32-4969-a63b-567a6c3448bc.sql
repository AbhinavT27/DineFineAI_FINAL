
-- Add missing RLS policies for all tables

-- Policies for search_history
CREATE POLICY "Users can view their own search history" 
  ON public.search_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" 
  ON public.search_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" 
  ON public.search_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for saved_restaurants
CREATE POLICY "Users can view their own saved restaurants" 
  ON public.saved_restaurants 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved restaurants" 
  ON public.saved_restaurants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved restaurants" 
  ON public.saved_restaurants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for user_restaurant_history
CREATE POLICY "Users can view their own restaurant history" 
  ON public.user_restaurant_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own restaurant history" 
  ON public.user_restaurant_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurant history" 
  ON public.user_restaurant_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for user_tags
CREATE POLICY "Users can view their own user tags" 
  ON public.user_tags 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own user tags" 
  ON public.user_tags 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user tags" 
  ON public.user_tags 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own user tags" 
  ON public.user_tags 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for restaurant_tags
CREATE POLICY "Users can view their own restaurant tags" 
  ON public.restaurant_tags 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own restaurant tags" 
  ON public.restaurant_tags 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant tags" 
  ON public.restaurant_tags 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurant tags" 
  ON public.restaurant_tags 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for menu_analysis (if needed by users)
CREATE POLICY "Users can view menu analysis" 
  ON public.menu_analysis 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create menu analysis" 
  ON public.menu_analysis 
  FOR INSERT 
  WITH CHECK (true);
