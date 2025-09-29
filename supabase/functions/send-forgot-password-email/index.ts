import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForgotPasswordRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ForgotPasswordRequest = await req.json();

    console.log('Sending forgot password email to:', email);

    // Import NotificationAPI
    const { default: notificationapi } = await import('https://esm.sh/notificationapi-node-server-sdk@latest');

    // Create Supabase admin client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${email}: ${otp}`);

    // Store OTP in forgot_password table
    const { error: insertError } = await supabaseAdmin
      .from('forgot_password')
      .insert({
        email: email,
        otp: otp,
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

    // Initialize NotificationAPI
    notificationapi.init(
      'q2m8szckmvo5foazfqq1popiim',
      'ym1sotndu571yspfdcyr2riufws90i1mz7i3axxvctgkhmtlhunwu1neoq'
    );

    // Send email via NotificationAPI with OTP
    const result = await notificationapi.send({
      type: 'forgot_password',
      to: {
        id: email,
        email: email
      },
      parameters: {
        "OTPExpiryMinutes": "10",
        "otp": otp
      }
    });

    console.log('NotificationAPI response:', result.data);

    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-forgot-password-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);