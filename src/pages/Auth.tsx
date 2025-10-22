
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

import Logo from '@/components/Logo';

const Auth = () => {
  const { t } = useTranslation();
  const { changeLanguage, availableLanguages, currentLanguage } = useLanguage();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Add new state to track if a user is newly registered
  const {
    setIsNewUser
  } = useAuth();
  
  // Check if all mandatory fields are filled for sign up
  const isSignUpFormValid = () => {
    if (isSignIn) return true;
    return username.trim() !== '' && 
           email.trim() !== '' && 
           password.trim() !== '' && 
           confirmPassword.trim() !== '' && 
           termsAccepted && 
           privacyAccepted;
  };
  
  const toggleMode = () => {
    setIsSignIn(!isSignIn);
    setAuthError(null);
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  
  const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    
    // Set the selected language immediately
    changeLanguage(selectedLanguage);
    
    if (!username.trim()) {
      setAuthError(t('auth.usernameRequired', 'Username is required'));
      setIsSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError(t('auth.passwordMismatch', 'Passwords do not match'));
      setIsSubmitting(false);
      return;
    }
    
    if (!termsAccepted) {
      setAuthError(t('auth.termsRequired', 'You must accept the Terms of Service'));
      setIsSubmitting(false);
      return;
    }
    
    if (!privacyAccepted) {
      setAuthError(t('auth.privacyRequired', 'You must accept the Privacy Policy'));
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Send OTP with validation (backend will check username and email availability)
      const { data, error } = await supabase.functions.invoke('send-signup-otp', {
        body: { 
          email: email,
          userData: {
            username: username,
            password: password,
            language: selectedLanguage
          }
        }
      });

      if (error) {
        // Try to extract the actual error message from the response
        if (error.message && error.message.includes('Edge Function returned a non-2xx status code')) {
          // The actual error is likely in the response body
          throw new Error(data?.error || "Username or email may already be taken. Please try different values.");
        } else {
          throw error;
        }
      }

      toast.success(t('auth.verificationSent', 'Verification code sent! Check your email.'));
      
      // Navigate to OTP verification with user data
      navigate(`/signup-verification?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&language=${encodeURIComponent(selectedLanguage)}`);
    } catch (error: any) {
      console.error('Sign up error:', error);
      setAuthError(error.message || "Failed to send verification code");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    
    // Set the selected language immediately
    changeLanguage(selectedLanguage);
    
    try {
      let emailToUse = email.trim();
      
      // Check if input is username (doesn't contain @)
      if (!email.includes('@')) {
        // Use the new database function to look up email by username
        const { data: lookupData, error: lookupError } = await supabase.rpc('lookup_email_for_username', {
          input_username: email.trim()
        });
          
        if (lookupError || !lookupData) {
          throw new Error(t('auth.usernameNotFound', 'Username not found. Please check your username and try again.'));
        }
        
        emailToUse = lookupData;
      }
      
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password
      });
      if (error) {
        throw error;
      }
      toast.success(t('auth.signInSuccess', 'Signed in successfully!'));
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthError(error.message || "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    console.log('Google sign-in button clicked');
    setIsSubmitting(true);
    setAuthError(null);
    try {
      console.log('Attempting Google OAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
      
      console.log('Google OAuth response:', { data, error });
      
      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }
      
      console.log('Google OAuth initiated successfully');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setAuthError(error.message || "Failed to sign in with Google");
    } finally {
      setIsSubmitting(false);
    }
  };

  
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex justify-center mb-2">
            <img 
              src="/DineFineAI_logo_transparent.png" 
              alt="DineFineAI Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-center">
            {isSignIn ? t('auth.login') : t('auth.signUp')}
          </CardTitle>
          <CardDescription className="text-center">{t('auth.tagline')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Button variant={isSignIn ? "default" : "outline"} className="w-full" onClick={() => setIsSignIn(true)}>
              {t('auth.login')}
            </Button>
            <Button variant={!isSignIn ? "default" : "outline"} className="w-full" onClick={() => setIsSignIn(false)}>
              {t('auth.signUp')}
            </Button>
          </div>

          {/* Language Selection - Only show during sign up */}
          {!isSignIn && (
            <div className="space-y-2 mb-6">
              <Label htmlFor="language">{t('auth.languagePreference')}</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={t('auth.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {authError && <div className="rounded-md bg-red-100 p-4 mb-4">
              <p className="text-sm text-red-800">{authError}</p>
            </div>}

          <form className="space-y-4">
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="username">{t('common.username')}</Label>
                <Input 
                  id="username" 
                  placeholder={t('common.username')} 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  disabled={isSubmitting} 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{isSignIn ? t('auth.emailOrUsername') : t('common.email')}</Label>
              <Input 
                id="email" 
                placeholder={isSignIn ? t('auth.emailOrUsername') : t('common.email')} 
                type={isSignIn ? "text" : "email"} 
                value={email} 
                onChange={handleEmailChange} 
                disabled={isSubmitting} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <PasswordInput 
                id="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={handlePasswordChange} 
                disabled={isSubmitting} 
              />
              {isSignIn && <div className="text-right">
                  <Link 
                    to="/reset-password"
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>}
            </div>

            {!isSignIn && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <PasswordInput 
                    id="confirmPassword" 
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    disabled={isSubmitting} 
                  />
                </div>

                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted} 
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)} 
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('auth.agreeToTerms')}{' '}
                    <Link 
                      to="/terms-of-service" 
                      className="text-blue-600 underline hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('auth.termsOfService')}
                    </Link>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="privacy" 
                    checked={privacyAccepted} 
                    onCheckedChange={(checked) => setPrivacyAccepted(checked === true)} 
                  />
                  <label 
                    htmlFor="privacy" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('auth.agreeToPrivacy')}{' '}
                    <Link 
                      to="/privacy-policy" 
                      className="text-blue-600 underline hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('auth.privacyPolicy')}
                    </Link>
                  </label>
                </div>
              </>
            )}

            <Button 
              className="w-full" 
              disabled={isSubmitting || !isSignUpFormValid()} 
              onClick={isSignIn ? handleSignIn : handleSignUp}
            >
              {isSubmitting ? isSignIn ? t('auth.signingIn') : t('auth.signingUp') : isSignIn ? t('auth.login') : t('auth.signUp')}
            </Button>

            {/* Google Sign-in temporarily disabled */}
            {false && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t('auth.orContinueWith')}
                    </span>
                  </div>
                </div>

                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full" 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Google button clicked - preventing default and calling handler');
                    handleGoogleSignIn();
                  }} 
                  disabled={isSubmitting}
                >
                  {isSignIn ? t('auth.signInWithGoogle') : t('auth.signUpWithGoogle')}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>;
};

export default Auth;
