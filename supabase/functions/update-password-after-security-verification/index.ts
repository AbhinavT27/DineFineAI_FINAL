import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Request received:', req.method);
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { email, resetToken, newPassword } = requestBody;

    if (!email || !resetToken || !newPassword) {
      console.log('Missing required fields - email:', !!email, 'resetToken:', !!resetToken, 'newPassword:', !!newPassword);
      return new Response(
        JSON.stringify({ success: false, error: 'Email, reset token, and new password are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (newPassword.length < 6) {
      console.log('Password too short:', newPassword.length);
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 6 characters long' }),
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

    // Get user by email using listUsers and find by email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Get user error:', getUserError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to find user' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const user = users.find((u: any) => u.email === email.trim())
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Verify reset token
    const storedToken = user.user_metadata?.password_reset_token
    const tokenExpires = user.user_metadata?.password_reset_token_expires
    
    if (!storedToken || !tokenExpires) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid reset token found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (new Date() > new Date(tokenExpires)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Reset token has expired' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (storedToken !== resetToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid reset token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
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
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update password' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Success
    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})