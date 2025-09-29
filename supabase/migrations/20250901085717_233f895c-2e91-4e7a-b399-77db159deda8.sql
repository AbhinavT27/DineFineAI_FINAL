-- Create function to check if user has premium subscription
CREATE OR REPLACE FUNCTION public.user_has_premium_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT subscribed AND subscription_tier = 'premium' 
     FROM public.subscribers 
     WHERE user_id = user_uuid 
     LIMIT 1), 
    false
  );
$$;

-- Drop existing policies for user_tags
DROP POLICY IF EXISTS "Users can create their own user tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can delete their own user tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can update their own user tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can view their own user tags" ON public.user_tags;

-- Create new policies for user_tags that require premium subscription
CREATE POLICY "Premium users can create their own user tags" ON public.user_tags
FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.user_has_premium_subscription(auth.uid()));

CREATE POLICY "Premium users can delete their own user tags" ON public.user_tags
FOR DELETE
USING (auth.uid() = user_id AND public.user_has_premium_subscription(auth.uid()));

CREATE POLICY "Premium users can update their own user tags" ON public.user_tags
FOR UPDATE
USING (auth.uid() = user_id AND public.user_has_premium_subscription(auth.uid()));

CREATE POLICY "Premium users can view their own user tags" ON public.user_tags
FOR SELECT
USING (auth.uid() = user_id AND public.user_has_premium_subscription(auth.uid()));

-- Drop existing policies for restaurant_tags
DROP POLICY IF EXISTS "Users can create their own restaurant tags" ON public.restaurant_tags;
DROP POLICY IF EXISTS "Users can delete their own restaurant tags" ON public.restaurant_tags;
DROP POLICY IF EXISTS "Users can update their own restaurant tags" ON public.restaurant_tags;
DROP POLICY IF EXISTS "Users can view their own restaurant tags" ON public.restaurant_tags;

-- Create new policies for restaurant_tags that require premium subscription
CREATE POLICY "Premium users can create their own restaurant tags" ON public.restaurant_tags
FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.user_has_premium_subscription(auth.uid()));

CREATE POLICY "Premium users can delete their own restaurant tags" ON public.restaurant_tags
FOR DELETE
USING (auth.uid() = user_id AND public.user_has_premium_subscription(auth.uid()));

CREATE POLICY "Premium users can update their own restaurant tags" ON public.restaurant_tags
FOR UPDATE
USING (auth.uid() = user_id AND public.user_has_premium_subscription(auth.uid()));

CREATE POLICY "Premium users can view their own restaurant tags" ON public.restaurant_tags
FOR SELECT
USING (auth.uid() = user_id AND public.user_has_premium_subscription(auth.uid()));