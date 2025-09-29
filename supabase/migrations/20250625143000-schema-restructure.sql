
-- Drop existing tables (in correct order to handle dependencies)
DROP TABLE IF EXISTS public.restaurant_tags CASCADE;
DROP TABLE IF EXISTS public.saved_restaurants CASCADE;
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.user_restaurant_history CASCADE;
DROP TABLE IF EXISTS public.user_tags CASCADE;
DROP TABLE IF EXISTS public.menu_analysis CASCADE;

-- Create Menu Analysis Table
CREATE TABLE public.menu_analysis (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    analysis_data jsonb,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.menu_analysis ENABLE ROW LEVEL SECURITY;

-- Create Restaurant Tags Table
CREATE TABLE public.restaurant_tags (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    tag text,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.restaurant_tags ENABLE ROW LEVEL SECURITY;

-- Create Saved Restaurants Table
CREATE TABLE public.saved_restaurants (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    restaurant_id text,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.saved_restaurants ENABLE ROW LEVEL SECURITY;

-- Create Search History Table
CREATE TABLE public.search_history (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    search_query text,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create User Restaurant History Table
CREATE TABLE public.user_restaurant_history (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    restaurant_id text,
    interaction_type text,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.user_restaurant_history ENABLE ROW LEVEL SECURITY;

-- Create User Tags Table
CREATE TABLE public.user_tags (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    tag text,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for menu_analysis
CREATE POLICY "Users can view their own menu analysis" 
  ON public.menu_analysis 
  FOR SELECT 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own menu analysis" 
  ON public.menu_analysis 
  FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own menu analysis" 
  ON public.menu_analysis 
  FOR UPDATE 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own menu analysis" 
  ON public.menu_analysis 
  FOR DELETE 
  USING (auth.uid() = profile_id);

-- Create RLS policies for restaurant_tags
CREATE POLICY "Users can view their own restaurant tags" 
  ON public.restaurant_tags 
  FOR SELECT 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own restaurant tags" 
  ON public.restaurant_tags 
  FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own restaurant tags" 
  ON public.restaurant_tags 
  FOR UPDATE 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own restaurant tags" 
  ON public.restaurant_tags 
  FOR DELETE 
  USING (auth.uid() = profile_id);

-- Create RLS policies for saved_restaurants
CREATE POLICY "Users can view their own saved restaurants" 
  ON public.saved_restaurants 
  FOR SELECT 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own saved restaurants" 
  ON public.saved_restaurants 
  FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own saved restaurants" 
  ON public.saved_restaurants 
  FOR DELETE 
  USING (auth.uid() = profile_id);

-- Create RLS policies for search_history
CREATE POLICY "Users can view their own search history" 
  ON public.search_history 
  FOR SELECT 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own search history" 
  ON public.search_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own search history" 
  ON public.search_history 
  FOR DELETE 
  USING (auth.uid() = profile_id);

-- Create RLS policies for user_restaurant_history
CREATE POLICY "Users can view their own restaurant history" 
  ON public.user_restaurant_history 
  FOR SELECT 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own restaurant history" 
  ON public.user_restaurant_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own restaurant history" 
  ON public.user_restaurant_history 
  FOR DELETE 
  USING (auth.uid() = profile_id);

-- Create RLS policies for user_tags
CREATE POLICY "Users can view their own user tags" 
  ON public.user_tags 
  FOR SELECT 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own user tags" 
  ON public.user_tags 
  FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own user tags" 
  ON public.user_tags 
  FOR UPDATE 
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own user tags" 
  ON public.user_tags 
  FOR DELETE 
  USING (auth.uid() = profile_id);
