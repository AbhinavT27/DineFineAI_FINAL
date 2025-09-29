-- Clean up security answer related data from user metadata
-- This migration removes security answer data that's no longer needed

-- Create a function to clean up user metadata (removing security answer fields)
CREATE OR REPLACE FUNCTION public.cleanup_user_security_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  updated_metadata jsonb;
BEGIN
  -- Loop through all users and remove security answer related fields from metadata
  FOR user_record IN 
    SELECT id, raw_user_meta_data 
    FROM auth.users 
    WHERE raw_user_meta_data ? 'security_answer' 
       OR raw_user_meta_data ? 'security_answer_hash'
  LOOP
    -- Remove security answer related fields
    updated_metadata := user_record.raw_user_meta_data;
    updated_metadata := updated_metadata - 'security_answer';
    updated_metadata := updated_metadata - 'security_answer_hash';
    
    -- Update the user metadata
    UPDATE auth.users 
    SET raw_user_meta_data = updated_metadata,
        updated_at = now()
    WHERE id = user_record.id;
  END LOOP;
  
  RAISE NOTICE 'Cleaned up security answer metadata for users';
END;
$$;

-- Execute the cleanup function
SELECT public.cleanup_user_security_metadata();

-- Drop the cleanup function since it's no longer needed
DROP FUNCTION public.cleanup_user_security_metadata();