-- Add comparison_key column to comparison_history table
ALTER TABLE comparison_history
ADD COLUMN comparison_key text;

-- Create unique constraint on user_id and comparison_key to prevent duplicates
CREATE UNIQUE INDEX unique_user_comparison_key
ON comparison_history (user_id, comparison_key);