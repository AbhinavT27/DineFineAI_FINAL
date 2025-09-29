import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOtpRequest {
  email: string;
  code: string;
  userData?: {
    username: string;
    phoneNumber: string;
    password: string;
    language?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Incoming request to verify-signup-otp");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, userData }: VerifyOtpRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Verifying OTP for email: ${email}`);

    // Find the verification code
    const { data: verificationData, error: fetchError } = await supabaseAdmin
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationData) {
      console.error('Invalid or expired OTP:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired verification code' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('OTP verified successfully, creating user account');

    // Mark the code as verified
    const { error: updateError } = await supabaseAdmin
      .from('email_verification_codes')
      .update({ verified: true })
      .eq('id', verificationData.id);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify code' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Create the user account if userData is provided
    if (userData) {
      console.log('Creating user account with verified email');
      
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: userData.password,
        email_confirm: true, // Skip email confirmation since we already verified via OTP
        user_metadata: {
          username: userData.username,
          phone: userData.phoneNumber,
          language: userData.language || 'en'
        }
      });

      if (signUpError) {
        console.error('Error creating user account:', signUpError);
        return new Response(
          JSON.stringify({ error: 'Failed to create account' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('User account created successfully, sending welcome email');

      // Send welcome email
      try {
        await supabaseAdmin.functions.invoke('send-welcome-email', {
          body: {
            email: email,
            username: userData.username,
            userId: signUpData.user.id
          }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the signup if email fails
      }

      console.log('User account created successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account created successfully!',
          user: signUpData.user,
          autoLogin: true
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email verified successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in verify-signup-otp function:', error);
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