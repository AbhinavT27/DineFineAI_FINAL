-- Create comparison_history table to store user's restaurant comparisons
CREATE TABLE public.comparison_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comparison_data JSONB NOT NULL,
  restaurant_ids TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.comparison_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own comparison history" 
ON public.comparison_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own comparison history" 
ON public.comparison_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comparison history" 
ON public.comparison_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_comparison_history_updated_at
BEFORE UPDATE ON public.comparison_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();