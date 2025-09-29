-- Add missing search_query column to menu_analysis table
ALTER TABLE public.menu_analysis 
ADD COLUMN search_query TEXT;

-- Create function to delete old menu analysis entries
CREATE OR REPLACE FUNCTION public.cleanup_old_menu_analysis()
RETURNS void AS $$
BEGIN
  DELETE FROM public.menu_analysis 
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_menu_analysis_updated_at
  BEFORE UPDATE ON public.menu_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();