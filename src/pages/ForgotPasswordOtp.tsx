import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const ForgotPasswordOtp = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  if (!email) {
    navigate('/reset-password');
    return null;
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-forgot-password-otp', {
        body: { email: email?.trim().toLowerCase(), otp: otp.trim() }
      });
      
      if (error) {
        console.error('OTP verification error:', error);
        toast.error(error.message || "Invalid or expired OTP");
        return;
      }
      
      if (!data.success || !data.resetToken) {
        toast.error("Invalid or expired OTP");
        return;
      }
      
      toast.success("OTP verified! Please set your new password.");
      navigate(`/new-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(data.resetToken)}`);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || "Failed to verify OTP");
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
          <CardTitle className="text-2xl text-center">Enter Verification Code</CardTitle>
          <CardDescription className="text-center">
            We've sent a 6-digit code to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP 
                value={otp} 
                onChange={setOtp} 
                maxLength={6} 
                disabled={isLoading}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
            <div className="text-center">
              <Link to="/reset-password" className="text-sm text-muted-foreground hover:underline">
                Back to reset password
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordOtp;