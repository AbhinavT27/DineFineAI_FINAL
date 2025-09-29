import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const SignupEmailVerification = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (!emailParam) {
      navigate('/auth');
      return;
    }
    setEmail(emailParam);
  }, [searchParams, navigate]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-signup-otp', {
        body: { 
          email: email, 
          code: otp 
        }
      });

      if (error) {
        console.error('OTP verification error:', error);
        toast.error(error.message || "Failed to verify code. Please try again.");
        return;
      }

      if (!data.success) {
        toast.error(data.error || "Invalid or expired verification code");
        return;
      }

      if (data.success) {
        toast.success("Email verified! Welcome to DineFine AI!");
        // Force page reload to ensure clean auth state
        window.location.href = '/profile?newUser=true';
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-signup-otp', {
        body: { email: email }
      });

      if (error) {
        toast.error("Failed to resend verification code");
        return;
      }

      if (data.success) {
        toast.success("Verification code sent to your email");
      }
    } catch (error) {
      toast.error("Failed to resend verification code");
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
          <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            Please enter the 6-digit code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex justify-center w-full">
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
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-sm text-muted-foreground hover:underline"
              >
                Didn't receive a code? Resend
              </button>
              
              <div>
                <Link to="/auth" className="text-sm text-muted-foreground hover:underline">
                  Back to sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupEmailVerification;