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
        JSON.stringify({ error: 'Email and security answer are required' }),
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

    // Check if profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.trim())
      .maybeSingle()

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify user information' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Email not found. Please check your email and try again.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Get user from auth system using admin access - use listUsers for reliable metadata
    const { data: usersData, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    const data = { user: usersData?.users?.find(u => u.email === email.trim()) }
    
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

    const authUser = data?.user
    
    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'User not found in authentication system' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Check if user has security answer in metadata
    const hashedSecurityAnswer = authUser.user_metadata?.security_answer_hash
    const plainTextAnswer = authUser.user_metadata?.security_answer
    
    console.log('Full authUser object:', JSON.stringify(authUser, null, 2))
    console.log('User metadata:', JSON.stringify(authUser.user_metadata, null, 2))
    console.log('Stored security answer hash:', hashedSecurityAnswer)
    console.log('Raw security answer in metadata:', plainTextAnswer)
    console.log('Input security answer (raw):', securityAnswer)
    console.log('Input security answer (processed):', securityAnswer.trim().toLowerCase())
    
    if (!hashedSecurityAnswer && !plainTextAnswer) {
      return new Response(
        JSON.stringify({ error: 'No security question set for this account. Please use password reset instead.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    let isMatch = false
    
    if (hashedSecurityAnswer) {
      // New format: use SHA-256 to compare with hash
      console.log('Using SHA-256 verification')
      const encoder = new TextEncoder()
      const inputData = encoder.encode(securityAnswer.trim().toLowerCase())
      const hashBuffer = await crypto.subtle.digest('SHA-256', inputData)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      console.log('Expected hash (from metadata):', hashedSecurityAnswer)
      console.log('Computed hash (from input):', inputHash)
      isMatch = hashedSecurityAnswer === inputHash
    } else if (plainTextAnswer) {
      // Legacy format: direct comparison with plain text
      console.log('Using plain text verification (legacy)')
      console.log('Comparing answer:', securityAnswer.trim().toLowerCase())
      console.log('Against stored plain text:', plainTextAnswer.toLowerCase())
      isMatch = securityAnswer.trim().toLowerCase() === plainTextAnswer.toLowerCase()
    }
    
    console.log('Verification result:', isMatch)
    
    if (!isMatch) {
      return new Response(
        JSON.stringify({ error: 'Incorrect security answer. Please try again.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Success
    return new Response(
      JSON.stringify({ success: true, email: email.trim() }),
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