import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string;
  resetToken: string;
  newPassword: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Password update request received');
    const requestBody: RequestBody = await req.json();
    console.log('Request body parsed');
    
    const { email, resetToken, newPassword } = requestBody;
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!email || !resetToken || !newPassword) {
      console.log('Missing required fields - email:', !!email, 'resetToken:', !!resetToken, 'newPassword:', !!newPassword);
      return new Response(
        JSON.stringify({ success: false, error: 'Email, reset token, and new password are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (newPassword.length < 6) {
      console.log('Password too short:', newPassword.length);
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 6 characters long' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user by email using listUsers and find by email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    const user = getUserError ? null : users.find((u: any) => u.email?.toLowerCase() === email.trim().toLowerCase());
    
    if (getUserError) {
      console.error('Get user error:', getUserError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to find user' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Verify reset token
    const storedToken = user.user_metadata?.password_reset_token;
    const tokenExpires = user.user_metadata?.password_reset_token_expires;
    
    if (!storedToken || !tokenExpires) {
      // Log failed attempt
      try {
        await supabaseAdmin.rpc('log_security_event', {
          p_user_id: user.id,
          p_event_type: 'password_reset_attempt',
          p_event_details: { email: email.trim(), reason: 'no_reset_token' },
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_success: false
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'No valid reset token found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (new Date() > new Date(tokenExpires)) {
      // Log failed attempt
      try {
        await supabaseAdmin.rpc('log_security_event', {
          p_user_id: user.id,
          p_event_type: 'password_reset_attempt',
          p_event_details: { email: email.trim(), reason: 'token_expired' },
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_success: false
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Reset token has expired' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (storedToken !== resetToken) {
      // Log failed attempt
      try {
        await supabaseAdmin.rpc('log_security_event', {
          p_user_id: user.id,
          p_event_type: 'password_reset_attempt',
          p_event_details: { email: email.trim(), reason: 'invalid_token' },
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_success: false
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid reset token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Update the user's password and clear reset tokens
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        password: newPassword,
        user_metadata: {
          ...user.user_metadata,
          password_reset_token: null,
          password_reset_token_expires: null
        }
      }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      // Log failed attempt
      try {
        await supabaseAdmin.rpc('log_security_event', {
          p_user_id: user.id,
          p_event_type: 'password_reset_attempt',
          p_event_details: { email: email.trim(), reason: 'update_failed' },
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_success: false
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update password' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Log successful password reset
    try {
      await supabaseAdmin.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'password_reset_success',
        p_event_details: { email: email.trim() },
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_success: true
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    // Success
    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});