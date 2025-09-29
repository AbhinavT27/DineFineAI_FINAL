import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Incoming request to verify-otp");
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth system using listUsers and find by email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Get user error:', getUserError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify user information' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const authUser = users.find((u: any) => u.email === email.trim())
    
    if (!authUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log("User found, checking OTP");

    // Check OTP from user metadata
    const storedOtp = authUser.user_metadata?.password_reset_otp
    const otpExpires = authUser.user_metadata?.password_reset_otp_expires
    
    if (!storedOtp || !otpExpires) {
      return new Response(
        JSON.stringify({ success: false, error: 'No OTP found. Please request a new one.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpExpires)) {
      return new Response(
        JSON.stringify({ success: false, error: 'OTP has expired. Please request a new one.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Verify OTP
    if (storedOtp !== otp.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid OTP. Please try again.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log("OTP verified successfully, generating reset token");

    // Generate temporary reset token (valid for 15 minutes)
    const resetToken = crypto.randomUUID()
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Clear OTP and store reset token
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      {
        user_metadata: {
          ...authUser.user_metadata,
          password_reset_otp: null,
          password_reset_otp_expires: null,
          password_reset_token: resetToken,
          password_reset_token_expires: resetTokenExpires
        }
      }
    )

    if (updateError) {
      console.error('Error storing reset token:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, resetToken }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})