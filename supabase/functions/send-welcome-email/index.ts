import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  username?: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username, userId }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', email);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate random 5-digit code
    const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();

    // Store verification code in database
    const { error: dbError } = await supabase
      .from('email_verification_codes')
      .insert({
        user_id: userId,
        email: email,
        code: verificationCode
      });

    if (dbError) {
      console.error('Error storing verification code:', dbError);
      throw new Error('Failed to store verification code');
    }

    // HTML email template
    const htmlTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Confirm Your Signup - DineFineAI</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <h1 style="margin: 0; font-size: 28px;">
                  Welcome to <span style="color: #d32f2f;">DineFine</span><span style="color: #ff9800;">AI</span>
                </h1>
                <p style="color: #666666; font-size: 16px;">
                  One step closer to finding food that fits your needs.
                </p>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td>
                <p style="font-size: 16px; line-height: 1.5; text-align: center;">
                  Just confirm your email address to complete your signup. Use the code below to verify your account:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <div style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d32f2f; background-color: #fcebea; padding: 20px 30px; border-radius: 10px;">
                    {{.Token}}
                  </div>
                </div>

                <p style="font-size: 14px; color: #999999; text-align: center;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top: 30px;">
                <p style="font-size: 12px; color: #cccccc;">
                  &copy; 2025 <span style="color: #d32f2f;">DineFine</span><span style="color: #ff9800;">AI</span> • Find food that fits you
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    // Replace the token placeholder with the actual verification code
    const emailContent = htmlTemplate.replace('{{.Token}}', verificationCode);

    // Import NotificationAPI
    const { default: notificationapi } = await import('https://esm.sh/notificationapi-node-server-sdk@latest');

    // Initialize NotificationAPI
    notificationapi.init(
      'q2m8szckmvo5foazfqq1popiim',
      'ym1sotndu571yspfdcyr2riufws90i1mz7i3axxvctgkhmtlhunwu1neoq'
    );

    // Send welcome email via NotificationAPI
    const result = await notificationapi.send({
      type: 'welcome_email',
      to: {
        email: email
      },
      parameters: {
        "username": username || email.split('@')[0],
        "verificationCode": verificationCode,
        "emailContent": emailContent
      }
    });

    console.log('NotificationAPI response:', result.data);

    return new Response(JSON.stringify({ success: true, data: result, code: verificationCode }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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