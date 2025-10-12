-- Fix sync issue: Update user_totals to match actual saved_restaurants count
UPDATE user_totals ut
SET saved_restaurants_count = (
  SELECT COUNT(*) 
  FROM saved_restaurants sr 
  WHERE sr.user_id = ut.user_id
)
WHERE EXISTS (
  SELECT 1 FROM saved_restaurants WHERE user_id = ut.user_id
);

-- Create trigger function to automatically sync saved_restaurants_count
CREATE OR REPLACE FUNCTION sync_saved_restaurants_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when restaurant is saved
    INSERT INTO user_totals (user_id, saved_restaurants_count, tags_count)
    VALUES (NEW.user_id, 1, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET saved_restaurants_count = user_totals.saved_restaurants_count + 1;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when restaurant is removed
    UPDATE user_totals 
    SET saved_restaurants_count = GREATEST(0, saved_restaurants_count - 1)
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger on saved_restaurants table
DROP TRIGGER IF EXISTS sync_saved_restaurants_count_trigger ON saved_restaurants;
CREATE TRIGGER sync_saved_restaurants_count_trigger
AFTER INSERT OR DELETE ON saved_restaurants
FOR EACH ROW
EXECUTE FUNCTION sync_saved_restaurants_count();