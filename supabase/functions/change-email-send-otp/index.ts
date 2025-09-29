import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
// NotificationAPI will be imported dynamically

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting change-email-send-otp function ===');
    const { newEmail } = await req.json();
    console.log('New email requested:', newEmail);

    if (!newEmail) {
      console.error('No new email provided');
      return new Response(
        JSON.stringify({ success: false, error: 'New email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User retrieval result:', { user: user?.id, error: userError });
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the new email is already in use by checking profiles table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', newEmail)
      .maybeSingle();
    
    if (existingProfile && existingProfile.id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is already in use' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('Generated OTP:', otp, 'Expires at:', expiresAt);

    // Store the email change request with OTP
    console.log('Storing email change request in database...');
    const { error: storeError } = await supabaseAdmin
      .from('email_change_requests')
      .insert({
        user_id: user.id,
        new_email: newEmail,
        current_email: user.email,
        otp: otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (storeError) {
      console.error('Error storing email change request:', storeError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create email change request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Email change request stored successfully');

    // Import and initialize NotificationAPI
    const { default: notificationapi } = await import('https://esm.sh/notificationapi-node-server-sdk@latest');
    
    notificationapi.init(
      'q2m8szckmvo5foazfqq1popiim',
      'ym1sotndu571yspfdcyr2riufws90i1mz7i3axxvctgkhmtlhunwu1neoq'
    );

    // Send OTP email
    try {
      console.log('Sending email change OTP to NotificationAPI...');
      const result = await notificationapi.send({
        type: 'change_email_address',
        to: {
          email: newEmail
        },
        parameters: {
          "otp": otp,
          "OTPExpiryMinutes": "10"
        }
      });

      console.log('NotificationAPI result:', result);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `OTP sent to ${newEmail}. Please verify to complete email change.` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (sendError) {
      console.error('NotificationAPI error:', sendError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send OTP email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in change-email-send-otp:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});