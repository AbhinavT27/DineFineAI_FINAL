import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOtpRequest {
  email: string;
  userData?: {
    username: string;
    phoneNumber: string;
    password: string;
    language?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Incoming request to send-signup-otp");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userData }: SendOtpRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (userData && !userData.username) {
      return new Response(
        JSON.stringify({ error: 'Username is required for signup' }),
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

    // If this is a signup request (userData provided), check for duplicates
    if (userData) {
      console.log(`Checking availability for email: ${email} and username: ${userData.username}`);

      // Check if email exists in profiles table
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking email in profiles:', profileError);
        return new Response(
          JSON.stringify({ error: 'Failed to check email availability' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Check if email exists in auth.users table
      const { data: existingAuthUser, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.error('Error checking email in auth.users:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to check email availability' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const emailExistsInAuth = existingAuthUser.users.some(
        user => user.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (existingProfile || emailExistsInAuth) {
        return new Response(
          JSON.stringify({ error: 'This email address is already registered. Please use a different email or sign in.' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Check if username exists
      const { data: existingUsername, error: usernameError } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('username', userData.username.trim())
        .single();

      if (usernameError && usernameError.code !== 'PGRST116') {
        console.error('Error checking username:', usernameError);
        return new Response(
          JSON.stringify({ error: 'Failed to check username availability' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      if (existingUsername) {
        return new Response(
          JSON.stringify({ error: 'This username is already taken. Please choose a different username.' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('Email and username are available, proceeding with OTP generation');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${email}: ${otp}`);

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin
      .from('email_verification_codes')
      .insert({
        email: email,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store verification code' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Send OTP email using NotificationAPI
    const { default: notificationapi } = await import('https://esm.sh/notificationapi-node-server-sdk@latest');

    // Initialize NotificationAPI
    notificationapi.init(
      'q2m8szckmvo5foazfqq1popiim',
      'ym1sotndu571yspfdcyr2riufws90i1mz7i3axxvctgkhmtlhunwu1neoq'
    );

    // Send OTP email
    const result = await notificationapi.send({
      type: 'welcome_',
      to: {
        email: email
      },
      parameters: {
        "verificationCode": otp
      }
    });

    console.log('NotificationAPI response:', result.data);

    console.log('OTP email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent to email' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-signup-otp function:', error);
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