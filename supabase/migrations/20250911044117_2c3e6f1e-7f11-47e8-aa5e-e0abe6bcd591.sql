-- Fix database function search paths (Security Warning #2)
-- Update all functions to have explicit search_path for security

-- Update existing functions to be secure
CREATE OR REPLACE FUNCTION public.get_or_create_user_totals(p_user_id uuid)
 RETURNS user_totals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_usage()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete old daily usage records (older than today)
  DELETE FROM public.daily_usage 
  WHERE usage_date < CURRENT_DATE;
  
  -- This function can be called manually or via a scheduled job
  -- The daily usage will naturally reset by date filtering in the application
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_premium_subscription(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT subscribed AND subscription_tier = 'premium' 
     FROM public.subscribers 
     WHERE user_id = user_uuid 
     LIMIT 1), 
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.lookup_username_for_auth(input_username text)
 RETURNS TABLE(id uuid, username text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.username 
  FROM public.profiles p 
  WHERE p.username = input_username
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.admin_insert_subscription(p_email text, p_subscription_tier text, p_subscription_end timestamp with time zone DEFAULT (now() + '1 year'::interval))
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_menu_analysis()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.menu_analysis 
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete from all tables that reference the user
  DELETE FROM public.app_feedback WHERE user_id = target_user_id;
  DELETE FROM public.comparison_history WHERE user_id = target_user_id;
  DELETE FROM public.email_change_requests WHERE user_id = target_user_id;
  DELETE FROM public.email_verification_codes WHERE user_id = target_user_id;
  DELETE FROM public.forgot_password WHERE user_id = target_user_id;
  DELETE FROM public.restaurant_tags WHERE user_id = target_user_id;
  DELETE FROM public.saved_restaurants WHERE user_id = target_user_id;
  DELETE FROM public.search_history WHERE user_id = target_user_id;
  DELETE FROM public.security_audit_log WHERE user_id = target_user_id;
  DELETE FROM public.tagged_restaurants WHERE user_id = target_user_id;
  DELETE FROM public.user_restaurant_history WHERE user_id = target_user_id;
  DELETE FROM public.user_tags WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return false
    RAISE NOTICE 'Error deleting user %: %', target_user_id, SQLERRM;
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When a user is deleted from auth.users, clean up all related data
  DELETE FROM public.app_feedback WHERE user_id = OLD.id;
  DELETE FROM public.comparison_history WHERE user_id = OLD.id;
  DELETE FROM public.email_change_requests WHERE user_id = OLD.id;
  DELETE FROM public.email_verification_codes WHERE user_id = OLD.id;
  DELETE FROM public.forgot_password WHERE user_id = OLD.id;
  DELETE FROM public.restaurant_tags WHERE user_id = OLD.id;
  DELETE FROM public.saved_restaurants WHERE user_id = OLD.id;
  DELETE FROM public.search_history WHERE user_id = OLD.id;
  DELETE FROM public.security_audit_log WHERE user_id = OLD.id;
  DELETE FROM public.tagged_restaurants WHERE user_id = OLD.id;
  DELETE FROM public.user_restaurant_history WHERE user_id = OLD.id;
  DELETE FROM public.user_tags WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE id = OLD.id;
  
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_event_details jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_success boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent,
    success
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_details,
    p_ip_address,
    p_user_agent,
    p_success
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;