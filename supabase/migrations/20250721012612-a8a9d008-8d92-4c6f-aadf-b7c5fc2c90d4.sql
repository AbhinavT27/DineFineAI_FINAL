-- Create forgot_password table to track password reset attempts
CREATE TABLE public.forgot_password (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  is_valid_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NULL
);

-- Enable Row Level Security
ALTER TABLE public.forgot_password ENABLE ROW LEVEL SECURITY;

-- Create policies for forgot_password table
CREATE POLICY "Anyone can insert forgot password attempts" 
ON public.forgot_password 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own forgot password attempts" 
ON public.forgot_password 
FOR SELECT 
USING (true);

-- Create index for better performance
CREATE INDEX idx_forgot_password_email ON public.forgot_password(email);
CREATE INDEX idx_forgot_password_created_at ON public.forgot_password(created_at);