-- Remove security_answer column from profiles table since we're moving to auth metadata
ALTER TABLE public.profiles DROP COLUMN IF EXISTS security_answer;

-- Update the handle_new_user function to not include security_answer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, email, phone_number)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email, 
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$function$;