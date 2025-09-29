-- Add search_path security to database functions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_menu_analysis() SECURITY DEFINER SET search_path = 'public';

-- Create audit trail table for security events
CREATE TABLE public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (users cannot see their own for security)
CREATE POLICY "Only service role can access audit logs" 
ON public.security_audit_log 
FOR ALL 
USING (false);

-- Create indexes for performance
CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_created_at ON public.security_audit_log(created_at);
CREATE INDEX idx_security_audit_log_event_type ON public.security_audit_log(event_type);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent,
    success
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_details,
    p_ip_address,
    p_user_agent,
    p_success
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;