-- Add unique constraint to username column in profiles table if it doesn't exist
-- This prevents race conditions during concurrent signups
DO $$ 
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_username_unique' 
        AND table_name = 'profiles'
    ) THEN
        -- Add unique constraint to username
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_username_unique UNIQUE (username);
        
        RAISE NOTICE 'Added unique constraint to username column';
    ELSE
        RAISE NOTICE 'Unique constraint on username already exists';
    END IF;
END $$;