-- Create email change requests table
CREATE TABLE public.email_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_email TEXT NOT NULL,
  new_email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_change_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for email change requests
CREATE POLICY "Users can view their own email change requests" 
ON public.email_change_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage email change requests" 
ON public.email_change_requests 
FOR ALL 
USING (false);