-- Allow admins to insert subscription data directly
-- This creates a function that bypasses RLS for admin operations

CREATE OR REPLACE FUNCTION public.admin_insert_subscription(
  p_email text,
  p_subscription_tier text,
  p_subscription_end timestamp with time zone DEFAULT (now() + interval '1 year')
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscription_id uuid;
  target_user_id uuid;
BEGIN
  -- Try to find existing user by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = p_email 
  LIMIT 1;
  
  -- Insert or update subscription record
  INSERT INTO public.subscribers (
    email,
    subscription_tier,
    subscribed,
    subscription_end,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    p_email,
    p_subscription_tier,
    true,
    p_subscription_end,
    target_user_id,
    now(),
    now()
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    subscription_tier = EXCLUDED.subscription_tier,
    subscribed = EXCLUDED.subscribed,
    subscription_end = EXCLUDED.subscription_end,
    user_id = EXCLUDED.user_id,
    updated_at = now()
  RETURNING id INTO subscription_id;
  
  RETURN subscription_id;
END;
$$;

-- Insert the specified email accounts with their plans
SELECT public.admin_insert_subscription('yoshi2turtle@protonmail.com', 'premium');
SELECT public.admin_insert_subscription('abhinav27.tammana@gmail.com', 'premium');
SELECT public.admin_insert_subscription('abhinavt@hotmail.com', 'pro');
SELECT public.admin_insert_subscription('ravig009@outlook.com', 'premium');