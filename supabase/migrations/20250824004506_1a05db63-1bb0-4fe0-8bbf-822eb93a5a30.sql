-- Update all test emails to premium subscription
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = NOW() + INTERVAL '1 year',
  updated_at = NOW()
WHERE email IN (
  'yoshi2turtle@protonmail.com',
  'abhinav27.tammana@gmail.com', 
  'abhinavt@hotmail.com',
  'ravig009@outlook.com'
);