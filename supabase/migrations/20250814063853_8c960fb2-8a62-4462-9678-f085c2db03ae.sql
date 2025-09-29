-- Fix security definer function with proper search_path
CREATE OR REPLACE FUNCTION get_or_create_user_totals(p_user_id UUID)
RETURNS public.user_totals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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