-- Insert test emails with different subscription tiers
INSERT INTO public.subscribers (
  email,
  user_id,
  stripe_customer_id,
  subscribed,
  subscription_tier,
  subscription_end,
  updated_at,
  created_at
) VALUES 
  (
    'yoshi2turtle@protonmail.com',
    NULL,
    NULL,
    true,
    'premium',
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
  ),
  (
    'abhinav27.tammana@gmail.com',
    NULL,
    NULL,
    true,
    'pro',
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
  ),
  (
    'abhinavt@hotmail.com',
    NULL,
    NULL,
    true,
    'premium',
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
  ),
  (
    'ravig009@outlook.com',
    NULL,
    NULL,
    false,
    'free',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE SET
  subscribed = EXCLUDED.subscribed,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end,
  updated_at = NOW();