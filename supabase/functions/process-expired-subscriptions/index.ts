import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    console.log('Processing expired subscriptions...')

    // Call the database function to process expired subscriptions
    const { error } = await supabaseClient.rpc('process_expired_subscriptions')

    if (error) {
      console.error('Error processing expired subscriptions:', error)
      throw error
    }

    console.log('Successfully processed expired subscriptions')

    return new Response(
      JSON.stringify({ success: true, message: 'Expired subscriptions processed' }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error in process-expired-subscriptions:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
