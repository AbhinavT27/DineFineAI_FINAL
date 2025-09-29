import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string;
  securityAnswer: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, securityAnswer }: RequestBody = await req.json();
    
    if (!email || !securityAnswer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and security answer are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const emailToUse = email.trim();
    const answerToVerify = securityAnswer.trim().toLowerCase();
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log('Verifying security answer for email:', emailToUse);

    // First check if user exists in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailToUse)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error looking up user profile' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profileData) {
      console.log('No profile found for email:', emailToUse);
      // Log failed attempt
      try {
        await supabase.rpc('log_security_event', {
          p_user_id: null,
          p_event_type: 'security_answer_attempt',
          p_event_details: { email: emailToUse, reason: 'user_not_found' },
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_success: false
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'User not found. Please check your email and try again.' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the user's security answer hash from auth metadata using admin API
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === emailToUse);
    if (authError) {
      console.error('Auth user lookup error:', authError);
      // Log failed attempt
      try {
        await supabase.rpc('log_security_event', {
          p_user_id: profileData.id,
          p_event_type: 'security_answer_attempt',
          p_event_details: { email: emailToUse, reason: 'auth_lookup_error' },
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_success: false
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify user information' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!user) {
      console.log('No auth user found for email:', emailToUse);
      // Log failed attempt
      try {
        await supabase.rpc('log_security_event', {
          p_user_id: profileData.id,
          p_event_type: 'security_answer_attempt',
          p_event_details: { email: emailToUse, reason: 'auth_user_not_found' },
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_success: false
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'User authentication data not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for bcrypt hash format or legacy plain text format  
    const storedHash = user.user_metadata?.security_answer_hash;
    const plainTextAnswer = user.user_metadata?.security_answer;
    
    console.log('User metadata check - Hash exists:', !!storedHash, 'Plain text exists:', !!plainTextAnswer);

    if (!storedHash && !plainTextAnswer) {
      console.log('No security answer found for user');
      // Log failed attempt
      try {
        await supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_event_type: 'security_answer_attempt',
          p_event_details: { email: emailToUse, reason: 'no_security_answer' },
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_success: false
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'No security question set for this account. Please contact support.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let isMatch = false;
    
    if (storedHash) {
      // New format: use bcrypt to compare with hash
      console.log('Using bcrypt verification');
      const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
      console.log('Comparing answer against bcrypt hash');
      isMatch = await bcrypt.compare(answerToVerify, storedHash);
    } else if (plainTextAnswer) {
      // Legacy format: direct comparison with plain text
      console.log('Using plain text verification (legacy)');
      console.log('Comparing against stored plain text');
      isMatch = answerToVerify === plainTextAnswer.toLowerCase();
    }
    
    console.log('Verification result:', isMatch);

    // Log the attempt
    try {
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'security_answer_attempt',
        p_event_details: { 
          email: emailToUse, 
          verification_method: storedHash ? 'bcrypt' : 'plain_text',
          reason: isMatch ? 'success' : 'incorrect_answer'
        },
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_success: isMatch
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    if (!isMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Incorrect security answer. Please try again.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Success
    console.log('Security answer verified successfully for:', emailToUse);
    return new Response(
      JSON.stringify({ success: true, message: 'Security answer verified successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Security verification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});