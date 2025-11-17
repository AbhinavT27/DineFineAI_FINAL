-- Add column to track scheduled cancellations
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;

-- Create function to process subscription downgrades at period end
CREATE OR REPLACE FUNCTION public.process_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Downgrade subscriptions that have passed their end date and are marked for cancellation
  UPDATE public.subscribers 
  SET 
    subscription_tier = 'free',
    subscribed = false,
    cancel_at_period_end = false,
    updated_at = now()
  WHERE 
    cancel_at_period_end = true 
    AND subscription_end IS NOT NULL 
    AND subscription_end <= now();
  
  RAISE NOTICE 'Processed expired subscriptions at %', NOW();
END;
$$;

-- Create function to handle subscription cancellation (keeps active until period end)
CREATE OR REPLACE FUNCTION public.cancel_subscription_at_period_end(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark subscription for cancellation at period end
  UPDATE public.subscribers 
  SET 
    cancel_at_period_end = true,
    updated_at = now()
  WHERE 
    user_id = p_user_id 
    AND subscribed = true;
  
  RETURN FOUND;
END;
$$;