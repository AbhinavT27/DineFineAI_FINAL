import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckUsernameRequest {
  username: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Incoming request to check-username-availability");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username }: CheckUsernameRequest = await req.json();

    if (!username || typeof username !== 'string' || !username.trim()) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
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

    console.log(`Checking username availability: ${username.trim()}`);

    // Check if username exists in profiles table
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking username:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check username availability' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const isAvailable = !existingUser;

    console.log(`Username ${username.trim()} availability: ${isAvailable}`);

    return new Response(
      JSON.stringify({ 
        available: isAvailable,
        message: isAvailable ? 'Username is available' : 'Username is already taken'
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in check-username-availability function:', error);
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