import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyOtpRequest = await req.json();

    console.log('Verifying OTP for email:', email);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Normalize inputs
    const normalizedEmail = (email || '').toLowerCase().trim();
    const normalizedOtp = (otp || '').trim();

    // Debugging logs
    console.log('Normalized email:', normalizedEmail);
    console.log('Normalized OTP length:', normalizedOtp.length);

    // Inspect existing records for this email (debug)
    const { data: debugData } = await supabaseAdmin
      .from('forgot_password')
      .select('*')
      .eq('email', normalizedEmail);
    console.log('Existing OTP records for email:', normalizedEmail, debugData);

    // Verify OTP from forgot_password table
    const { data: otpRecord, error: selectError } = await supabaseAdmin
      .from('forgot_password')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('otp', normalizedOtp)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (selectError || !otpRecord) {
      console.error('OTP verification failed:', selectError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('OTP verified successfully, generating reset token');

    // Generate temporary reset token (valid for 15 minutes)
    const resetToken = crypto.randomUUID();
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Get user by email to store reset token in metadata
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error getting user:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to find user' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Store reset token in user metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          password_reset_token: resetToken,
          password_reset_token_expires: resetTokenExpires
        }
      }
    );

    if (updateError) {
      console.error('Error storing reset token:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset token' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Delete used OTP
    await supabaseAdmin
      .from('forgot_password')
      .delete()
      .eq('email', email.toLowerCase().trim())
      .eq('otp', otp.trim());

    console.log('Reset token generated successfully for:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        resetToken: resetToken
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in verify-forgot-password-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);