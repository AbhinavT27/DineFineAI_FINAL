
-- Drop existing tables (in correct order to handle dependencies)
DROP TABLE IF EXISTS public.restaurant_tags CASCADE;
DROP TABLE IF EXISTS public.saved_restaurants CASCADE;
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.user_restaurant_history CASCADE;
DROP TABLE IF EXISTS public.user_tags CASCADE;
DROP TABLE IF EXISTS public.menu_analysis CASCADE;

-- Create Menu Analysis Table (preserving all original columns)
CREATE TABLE public.menu_analysis (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    restaurant_id text NOT NULL,
    restaurant_name text NOT NULL,
    restaurant_website text NOT NULL,
    menu_items jsonb NOT NULL DEFAULT '[]'::jsonb,
    scraped boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
ALTER TABLE public.menu_analysis ENABLE ROW LEVEL SECURITY;

-- Create Restaurant Tags Table
CREATE TABLE public.restaurant_tags (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    restaurant_id text NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.restaurant_tags ENABLE ROW LEVEL SECURITY;

-- Create Saved Restaurants Table (preserving restaurant_data)
CREATE TABLE public.saved_restaurants (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    restaurant_id text NOT NULL,
    restaurant_data jsonb NOT NULL,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.saved_restaurants ENABLE ROW LEVEL SECURITY;

-- Create Search History Table (preserving all search parameters)
CREATE TABLE public.search_history (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    search_query text NOT NULL,
    cuisine_type text,
    price_range text,
    dietary_restrictions text[],
    location text,
    coordinates jsonb,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create User Restaurant History Table (preserving restaurant_data and action_type)
CREATE TABLE public.user_restaurant_history (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    restaurant_id text NOT NULL,
    restaurant_data jsonb NOT NULL,
    action_type text NOT NULL,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.user_restaurant_history ENABLE ROW LEVEL SECURITY;

-- Create User Tags Table (preserving tag_name and color)
CREATE TABLE public.user_tags (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) ON DELETE CASCADE,
    tag_name text NOT NULL,
    color text DEFAULT '#3B82F6',
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
