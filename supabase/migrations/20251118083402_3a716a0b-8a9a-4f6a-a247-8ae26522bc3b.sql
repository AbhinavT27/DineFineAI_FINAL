-- Enable realtime for subscribers table
ALTER TABLE public.subscribers REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscribers;