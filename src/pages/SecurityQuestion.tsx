import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { supabase } from '@/integrations/supabase/client';

const SecurityQuestion = () => {
  const [email, setEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!email.trim() || !securityAnswer.trim()) {
      setError("Please enter both email and security answer");
      setIsSubmitting(false);
      return;
    }

    try {
      const emailToUse = email.trim();

      // Use edge function to verify security answer with bcrypt
      const { data, error } = await supabase.functions.invoke('verify-security-answer-bcrypt', {
        body: {
          email: emailToUse,
          securityAnswer: securityAnswer.trim()
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error("Failed to verify security answer");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to verify security answer");
      }

      // Success - redirect to new password page
      toast.success("Security answer verified successfully!");
      navigate(`/new-password?email=${encodeURIComponent(emailToUse)}`);
    } catch (error: any) {
      console.error('Security verification error:', error);
      setError(error.message || "Failed to verify security answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Security Question
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and answer your security question to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-red-100 p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                placeholder="Enter your email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={isSubmitting} 
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityAnswer">What is your favorite food?</Label>
              <Input 
                id="securityAnswer" 
                placeholder="Enter your favorite food" 
                type="text" 
                value={securityAnswer} 
                onChange={(e) => setSecurityAnswer(e.target.value)} 
                disabled={isSubmitting} 
                required
              />
            </div>

            <Button 
              type="submit"
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify Answer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityQuestion;