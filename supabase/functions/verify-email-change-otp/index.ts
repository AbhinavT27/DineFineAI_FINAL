import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

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
    const { otp, newEmail } = await req.json();

    if (!otp || !newEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'OTP and new email are required' }),
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
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify OTP
    const { data: emailChangeRequest, error: verifyError } = await supabaseAdmin
      .from('email_change_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('new_email', newEmail)
      .eq('otp', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (verifyError || !emailChangeRequest) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired OTP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email is already in use by querying the database directly
    const { data: existingProfiles, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', newEmail)
      .neq('id', user.id);
    
    if (profileCheckError) {
      console.error('Error checking existing profiles:', profileCheckError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to verify email availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingProfiles && existingProfiles.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email address is already in use' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Additional check using auth admin - get users by email
    try {
      const { data: authUsers, error: authCheckError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!authCheckError && authUsers?.users) {
        const emailInUse = authUsers.users.some(u => u.email === newEmail && u.id !== user.id);
        if (emailInUse) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email address is already in use' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (authError) {
      console.log('Auth check warning:', authError);
      // Continue anyway as this is a secondary check
    }

    // Update user email in Supabase Auth with enhanced error handling
    let updatedUser, updateError;
    
    try {
      console.log(`Attempting to update email for user ${user.id} to ${newEmail}`);
      
      const updateResult = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { 
          email: newEmail,
          email_confirm: true
        }
      );
      
      updatedUser = updateResult.data;
      updateError = updateResult.error;
      
    } catch (authError) {
      console.error('Auth update failed with exception:', authError);
      updateError = authError;
    }

    if (updateError) {
      console.error('Error updating user email:', updateError);
      
      // Handle specific error types
      const errorMessage = (updateError as any)?.message || updateError.toString();
      
      if (errorMessage.includes('already exists') || 
          errorMessage.includes('duplicate') ||
          errorMessage.includes('unique constraint') ||
          (updateError as any)?.status === 409) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email address is already in use' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (errorMessage.includes('User not found') || (updateError as any)?.status === 404) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update email. Please try again later.',
          details: errorMessage
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile email
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile email:', profileError);
      // Continue anyway, auth email is updated
    }

    // Mark the request as verified
    await supabaseAdmin
      .from('email_change_requests')
      .update({ verified: true })
      .eq('id', emailChangeRequest.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email updated successfully! Please sign in again with your new email.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-email-change-otp:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});