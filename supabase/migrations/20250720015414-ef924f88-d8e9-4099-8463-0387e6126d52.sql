-- Update the handle_new_user function to include security_answer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, email, phone_number, security_answer)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email, 
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'security_answer'
  );
  RETURN new;
END;
$function$;