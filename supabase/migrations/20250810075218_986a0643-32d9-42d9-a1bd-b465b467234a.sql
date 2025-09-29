-- Fix incorrect RLS policies to use user_id instead of id for user-scoped tables

-- SAVED_RESTAURANTS
ALTER TABLE public.saved_restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own saved restaurants" ON public.saved_restaurants;
DROP POLICY IF EXISTS "Users can delete their own saved restaurants" ON public.saved_restaurants;
DROP POLICY IF EXISTS "Users can view their own saved restaurants" ON public.saved_restaurants;

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


-- USER_TAGS
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own user tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can delete their own user tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can update their own user tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can view their own user tags" ON public.user_tags;

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


-- RESTAURANT_TAGS
ALTER TABLE public.restaurant_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own restaurant tags" ON public.restaurant_tags;
DROP POLICY IF EXISTS "Users can delete their own restaurant tags" ON public.restaurant_tags;
DROP POLICY IF EXISTS "Users can update their own restaurant tags" ON public.restaurant_tags;
DROP POLICY IF EXISTS "Users can view their own restaurant tags" ON public.restaurant_tags;

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


-- TAGGED_RESTAURANTS
ALTER TABLE public.tagged_restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can delete their own tagged restaurants" ON public.tagged_restaurants;
DROP POLICY IF EXISTS "Users can insert their own tagged restaurants" ON public.tagged_restaurants;
DROP POLICY IF EXISTS "Users can update their own tagged restaurants" ON public.tagged_restaurants;
DROP POLICY IF EXISTS "Users can view their own tagged restaurants" ON public.tagged_restaurants;

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