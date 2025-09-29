
-- Add location and useCurrentLocation columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN location TEXT,
ADD COLUMN useCurrentLocation BOOLEAN DEFAULT true;
