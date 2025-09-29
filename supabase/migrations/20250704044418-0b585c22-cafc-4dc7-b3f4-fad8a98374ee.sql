
-- Add distance_unit column to profiles table to store user preference
ALTER TABLE public.profiles 
ADD COLUMN distance_unit text DEFAULT 'miles' CHECK (distance_unit IN ('miles', 'km'));
