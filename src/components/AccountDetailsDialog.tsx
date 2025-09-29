import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
interface AccountDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}
export const AccountDetailsDialog = ({
  open,
  onOpenChange,
  userEmail
}: AccountDetailsDialogProps) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Email change states
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handlePasswordChange = async () => {
    if (!oldPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    setIsChangingPassword(true);
    try {
      // First verify the old password
      const {
        error: signInError
      } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword
      });
      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      // If old password is correct, update to new password
      const {
        error: updateError
      } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;
      toast.success('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };
  const handleSendEmailOtp = async () => {
    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }
    if (newEmail === userEmail) {
      toast.error('New email must be different from current email');
      return;
    }

    setIsSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('change-email-send-otp', {
        body: { newEmail }
      });
      
      if (error) throw error;
      
      toast.success('OTP sent to your new email address');
      setShowOtpForm(true);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsChangingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-change-otp', {
        body: { otp, newEmail }
      });
      
      if (error) throw error;
      
      toast.success('Email changed successfully! Please sign in again with your new email.');
      // Force logout and redirect to auth
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
  };

  const handleCancelEmailChange = () => {
    setNewEmail('');
    setOtp('');
    setShowEmailForm(false);
    setShowOtpForm(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Details
          </DialogTitle>
          <DialogDescription>
            View your account information and manage your password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Email Address</h4>
              {!showEmailForm && (
                <Button variant="outline" size="sm" onClick={() => setShowEmailForm(true)}>
                  Change Email
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-email">Current Email</Label>
              <Input id="current-email" value={userEmail} disabled className="bg-muted" />
            </div>

            {showEmailForm && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                {!showOtpForm ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">New Email Address</Label>
                      <Input 
                        id="new-email" 
                        type="email" 
                        value={newEmail} 
                        onChange={(e) => setNewEmail(e.target.value)} 
                        placeholder="Enter your new email address" 
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={handleSendEmailOtp} 
                        disabled={isSendingOtp || !newEmail} 
                        size="sm"
                      >
                        {isSendingOtp ? 'Sending...' : 'Send Verification Code'}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEmailChange} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Enter Verification Code</Label>
                      <p className="text-sm text-muted-foreground">
                        We've sent a 6-digit code to {newEmail}
                      </p>
                      <div className="flex justify-center w-full">
                        <InputOTP 
                          value={otp} 
                          onChange={setOtp} 
                          maxLength={6} 
                          disabled={isChangingEmail}
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
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={handleVerifyEmailOtp} 
                        disabled={isChangingEmail || otp.length !== 6} 
                        size="sm"
                      >
                        {isChangingEmail ? 'Verifying...' : 'Verify & Change Email'}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEmailChange} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Password</h4>
              {!showPasswordForm && <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                  Change Password
                </Button>}
            </div>

            {showPasswordForm && <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="old-password">Current Password</Label>
                  <Input id="old-password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Enter current password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handlePasswordChange} disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword} size="sm">
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                  <Button variant="outline" onClick={handleCancelPasswordChange} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};