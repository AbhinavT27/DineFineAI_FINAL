-- Update admin function to use Stripe tables with simple UUID generation
CREATE OR REPLACE FUNCTION public.admin_insert_stripe_subscription(
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
  customer_id text;
  subscription_id text;
  target_user_id uuid;
  random_suffix text;
BEGIN
  -- Try to find existing user by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = p_email 
  LIMIT 1;
  
  -- Generate simple customer ID
  random_suffix := substr(md5(random()::text || p_email), 1, 12);
  customer_id := 'cust_admin_' || random_suffix;
  
  -- Insert or update customer record in Stripe Customers table
  INSERT INTO public."Customers" (
    id,
    email,
    name,
    description,
    created,
    attrs
  ) VALUES (
    customer_id,
    p_email,
    split_part(p_email, '@', 1),
    'Admin created customer for ' || p_subscription_tier || ' plan',
    extract(epoch from now()),
    json_build_object('user_id', target_user_id, 'subscription_tier', p_subscription_tier)
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    attrs = json_build_object('user_id', EXCLUDED.attrs->'user_id', 'subscription_tier', p_subscription_tier);
  
  -- If not free tier, create subscription record
  IF p_subscription_tier != 'free' THEN
    subscription_id := 'sub_admin_' || substr(md5(random()::text || p_email || p_subscription_tier), 1, 12);
    
    INSERT INTO public."Subscribers" (
      id,
      customer,
      current_period_start,
      current_period_end,
      currency,
      attrs
    ) VALUES (
      subscription_id,
      customer_id,
      now(),
      p_subscription_end,
      'usd',
      json_build_object(
        'user_id', target_user_id, 
        'subscription_tier', p_subscription_tier,
        'status', 'active',
        'admin_created', true
      )
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      current_period_end = p_subscription_end,
      attrs = json_build_object(
        'user_id', target_user_id, 
        'subscription_tier', p_subscription_tier,
        'status', 'active',
        'admin_created', true
      );
  ELSE
    -- Remove any existing subscription for free tier
    DELETE FROM public."Subscribers" WHERE customer = customer_id;
  END IF;
  
  RETURN target_user_id;
END;
$$;

-- Insert the specified email accounts with their plans using the new function
SELECT public.admin_insert_stripe_subscription('yoshi2turtle@protonmail.com', 'premium');
SELECT public.admin_insert_stripe_subscription('abhinav27.tammana@gmail.com', 'premium');
SELECT public.admin_insert_stripe_subscription('abhinavt@hotmail.com', 'pro');
SELECT public.admin_insert_stripe_subscription('ravig009@outlook.com', 'premium');