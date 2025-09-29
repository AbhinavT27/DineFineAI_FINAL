import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Incoming request to check-email-availability");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: CheckEmailRequest = await req.json();

    if (!email || typeof email !== 'string' || !email.trim()) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Checking email availability: ${email.trim().toLowerCase()}`);

    // Check if email exists in profiles table
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking email in profiles:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to check email availability' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Also check if email exists in auth.users table
    const { data: existingAuthUser, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error checking email in auth.users:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to check email availability' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const emailExistsInAuth = existingAuthUser.users.some(
      user => user.email?.toLowerCase() === email.trim().toLowerCase()
    );

    const isAvailable = !existingProfile && !emailExistsInAuth;

    console.log(`Email ${email.trim().toLowerCase()} availability: ${isAvailable}`);

    return new Response(
      JSON.stringify({ 
        available: isAvailable,
        message: isAvailable ? 'Email is available' : 'Email is already taken'
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in check-email-availability function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);