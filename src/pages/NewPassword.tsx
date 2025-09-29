import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const NewPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const resetToken = searchParams.get('token');

  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/reset-password');
    }
  }, [email, resetToken, navigate]);

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error("Please enter a new password");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-password-secure', {
        body: { 
          email, 
          resetToken, 
          newPassword: password.trim() 
        }
      });
      
      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message || "Failed to reset password");
        return;
      }
      
      if (!data.success) {
        toast.error(data.error || "Failed to reset password");
        return;
      }
      
      toast.success("Password reset successfully! You can now sign in.");
      
      // Sign in the user automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email!,
        password: password.trim()
      });
      
      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        navigate('/auth');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !resetToken) {
    return null;
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <PasswordInput 
                id="password" 
                placeholder="Enter new password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                disabled={isLoading} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput 
                id="confirmPassword" 
                placeholder="Confirm new password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                disabled={isLoading} 
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating Password..." : "Update Password"}
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

export default NewPassword;