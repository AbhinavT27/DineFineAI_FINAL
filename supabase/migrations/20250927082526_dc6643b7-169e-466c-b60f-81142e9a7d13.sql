-- Add 'saved' column to history tables to allow users to permanently save entries
ALTER TABLE public.user_restaurant_history 
ADD COLUMN saved BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.search_history 
ADD COLUMN saved BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.comparison_history 
ADD COLUMN saved BOOLEAN NOT NULL DEFAULT false;

-- Create function to check if a record is older than 2 weeks and not saved
CREATE OR REPLACE FUNCTION public.is_history_expired(created_date TIMESTAMP WITH TIME ZONE, is_saved BOOLEAN)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (created_date < NOW() - INTERVAL '2 weeks') AND NOT is_saved;
$$;

-- Update existing RLS policies for user_restaurant_history to include time-based deletion
DROP POLICY IF EXISTS "Users can view their own restaurant history" ON public.user_restaurant_history;
DROP POLICY IF EXISTS "Users can create their own restaurant history" ON public.user_restaurant_history;
DROP POLICY IF EXISTS "Users can update their own restaurant history" ON public.user_restaurant_history;
DROP POLICY IF EXISTS "Users can delete their own restaurant history" ON public.user_restaurant_history;

CREATE POLICY "Users can view their own restaurant history"
ON public.user_restaurant_history
FOR SELECT
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);

CREATE POLICY "Users can create their own restaurant history"
ON public.user_restaurant_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant history"
ON public.user_restaurant_history
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);

CREATE POLICY "Users can delete their own restaurant history"
ON public.user_restaurant_history
FOR DELETE
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);

-- Update existing RLS policies for search_history to include time-based deletion
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.search_history;
DROP POLICY IF EXISTS "Users can create their own search history" ON public.search_history;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.search_history;

CREATE POLICY "Users can view their own search history"
ON public.search_history
FOR SELECT
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);

CREATE POLICY "Users can create their own search history"
ON public.search_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search history"
ON public.search_history
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);

CREATE POLICY "Users can delete their own search history"
ON public.search_history
FOR DELETE
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);

-- Update existing RLS policies for comparison_history to include time-based deletion
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.comparison_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.comparison_history;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.comparison_history;

CREATE POLICY "Users can view their own comparison history"
ON public.comparison_history
FOR SELECT
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);

CREATE POLICY "Users can create their own comparison history"
ON public.comparison_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comparison history"
ON public.comparison_history
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);

CREATE POLICY "Users can delete their own comparison history"
ON public.comparison_history
FOR DELETE
USING (
  auth.uid() = user_id 
  AND NOT public.is_history_expired(created_at, saved)
);