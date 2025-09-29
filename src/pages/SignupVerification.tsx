import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/sonner";
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SignupVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const language = searchParams.get('language');
    
    if (!emailParam) {
      navigate('/auth');
      return;
    }

    setEmail(emailParam);
    setUserData({
      username,
      password,
      language
    });
  }, [searchParams, navigate]);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-signup-otp', {
        body: {
          email: email,
          code: otp,
          userData: userData
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        if (data.autoLogin && data.user) {
          // User was automatically logged in
          toast.success("Account created successfully! Welcome to DineFineAI!");
          // Redirect to profile page for new users
          navigate('/profile?newUser=true');
        } else if (data.requiresManualLogin) {
          toast.success("Account created successfully! Please sign in.");
          navigate('/auth');
        } else {
          toast.success("Account created successfully! You can now sign in.");
          navigate('/auth');
        }
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-center">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <InputOTP 
              maxLength={6} 
              value={otp} 
              onChange={(value) => setOtp(value)}
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
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify & Create Account"}
          </Button>

          <div className="text-center">
            <Link 
              to="/auth" 
              className="text-sm text-muted-foreground hover:underline"
            >
              Back to signup
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupVerification;
