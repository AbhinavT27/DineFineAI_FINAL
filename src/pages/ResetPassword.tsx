import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'invalid-token') {
      toast.error("Invalid or expired reset link. Please request a new password reset.");
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      // Send password reset email using custom edge function
      const { error } = await supabase.functions.invoke('send-forgot-password-email', {
        body: { email: email.trim() }
      });
      
      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message || "Failed to send reset email");
        return;
      }
      
      toast.success("Verification code sent! Please check your email.");
      navigate(`/forgot-password-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || "Failed to process reset request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email address" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                disabled={isLoading} 
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending Reset Email..." : "Send Reset Email"}
            </Button>
            <div className="text-center">
              <Link to="/auth" className="text-sm text-muted-foreground hover:underline">
                Back to sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;