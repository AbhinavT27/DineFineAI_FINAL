-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Create usage tracking tables for plan limits
CREATE TABLE public.daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  restaurant_scrapes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS for daily_usage
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_daily_usage" ON public.daily_usage
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create user totals table for saved restaurants and tags count
CREATE TABLE public.user_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_restaurants_count INTEGER NOT NULL DEFAULT 0,
  tags_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for user_totals
ALTER TABLE public.user_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_totals" ON public.user_totals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at on subscribers
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update updated_at on daily_usage  
CREATE TRIGGER update_daily_usage_updated_at
BEFORE UPDATE ON public.daily_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update updated_at on user_totals
CREATE TRIGGER update_user_totals_updated_at
BEFORE UPDATE ON public.user_totals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get or create user totals
CREATE OR REPLACE FUNCTION get_or_create_user_totals(p_user_id UUID)
RETURNS public.user_totals
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result public.user_totals;
BEGIN
  SELECT * INTO result FROM public.user_totals WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_totals (user_id, saved_restaurants_count, tags_count)
    VALUES (p_user_id, 0, 0)
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$;