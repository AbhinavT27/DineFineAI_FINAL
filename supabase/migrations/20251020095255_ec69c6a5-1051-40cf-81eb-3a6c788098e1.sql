-- Modify the existing cleanup function to also handle comparison_history
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_generated_menus()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete AI generated menus older than 2 days
  DELETE FROM public.ai_generated_menus 
  WHERE created_at < NOW() - INTERVAL '2 days';
  
  -- Delete comparison history older than 1 day
  DELETE FROM public.comparison_history 
  WHERE created_at < NOW() - INTERVAL '1 day';
  
  RAISE NOTICE 'Cleanup completed: AI menus and comparison history at %', NOW();
END;
$function$;