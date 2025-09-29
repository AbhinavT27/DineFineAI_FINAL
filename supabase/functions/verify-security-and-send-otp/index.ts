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
    const { email, securityAnswer } = await req.json()

    if (!email || !securityAnswer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and security answer are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.trim())
      .maybeSingle()

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify user information' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email not found. Please check your email and try again.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Get user from auth system using listUsers and find by email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Get user error:', getUserError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify user information' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const authUser = users.find((u: any) => u.email === email.trim())
    
    if (!authUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found in authentication system' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Check if user has security answer in metadata
    const hashedSecurityAnswer = authUser.user_metadata?.security_answer_hash
    const plainTextAnswer = authUser.user_metadata?.security_answer
    
    if (!hashedSecurityAnswer && !plainTextAnswer) {
      return new Response(
        JSON.stringify({ success: false, error: 'No security question set for this account. Please use password reset instead.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let isMatch = false
    
    if (hashedSecurityAnswer) {
      // Use SHA-256 to compare with hash
      const encoder = new TextEncoder()
      const inputData = encoder.encode(securityAnswer.trim().toLowerCase())
      const hashBuffer = await crypto.subtle.digest('SHA-256', inputData)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      isMatch = hashedSecurityAnswer === inputHash
    } else if (plainTextAnswer) {
      // Legacy format: direct comparison with plain text
      isMatch = securityAnswer.trim().toLowerCase() === plainTextAnswer.toLowerCase()
    }
    
    if (!isMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Incorrect security answer. Please try again.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store OTP in user metadata (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      {
        user_metadata: {
          ...authUser.user_metadata,
          password_reset_otp: otp,
          password_reset_otp_expires: expiresAt
        }
      }
    )

    if (updateError) {
      console.error('Error storing OTP:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate OTP' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Import NotificationAPI
    const { default: notificationapi } = await import('https://esm.sh/notificationapi-node-server-sdk@latest');

    // Initialize NotificationAPI
    notificationapi.init(
      'q2m8szckmvo5foazfqq1popiim',
      'ym1sotndu571yspfdcyr2riufws90i1mz7i3axxvctgkhmtlhunwu1neoq'
    );

    // Send OTP email
    const result = await notificationapi.send({
      type: 'forgot_password',
      to: {
        email: email
      },
      parameters: {
        otp: otp,
        expires_in: '10 minutes'
      }
    });

    console.log('NotificationAPI response:', result.data);

    return new Response(
      JSON.stringify({ success: true }),
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
        status: 200 
      }
    )
  }
})