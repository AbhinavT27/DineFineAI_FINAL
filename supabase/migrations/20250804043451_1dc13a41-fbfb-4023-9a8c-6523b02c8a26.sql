-- Enable leaked password protection for enhanced security
UPDATE auth.config
SET 
  password_requirements = jsonb_set(
    COALESCE(password_requirements, '{}'::jsonb),
    '{hibp_enabled}',
    'true'::jsonb
  );