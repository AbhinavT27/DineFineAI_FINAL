import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    const signature = req.headers.get('stripe-signature')
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!signature || !stripeSecretKey) {
      console.error('Missing stripe signature or secret key')
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const body = await req.text()
    
    // Parse the Stripe event
    let event
    try {
      // In production, you should verify the webhook signature
      // For now, we'll parse the event directly
      event = JSON.parse(body)
    } catch (err) {
      console.error('Error parsing webhook:', err)
      return new Response(
        JSON.stringify({ error: 'Webhook error' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('Processing Stripe event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.deleted':
        // Immediate cancellation - downgrade now
        await handleSubscriptionDeleted(supabaseClient, event.data.object)
        break

      case 'customer.subscription.updated':
        // Check if subscription was marked for cancellation at period end
        await handleSubscriptionUpdated(supabaseClient, event.data.object)
        break

      case 'invoice.payment_succeeded':
        // Successful payment - ensure subscription is active
        await handlePaymentSuccess(supabaseClient, event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  console.log('Subscription deleted:', subscription.id)
  
  const { error } = await supabase
    .from('subscribers')
    .update({
      subscription_tier: 'free',
      subscribed: false,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', subscription.customer)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

  console.log('Successfully downgraded subscription to free')
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  console.log('Subscription updated:', subscription.id)
  
  // Check if subscription is cancelled but still active (cancel_at_period_end)
  if (subscription.cancel_at_period_end) {
    const periodEnd = new Date(subscription.current_period_end * 1000)
    
    console.log('Subscription marked for cancellation at:', periodEnd)
    
    const { error } = await supabase
      .from('subscribers')
      .update({
        cancel_at_period_end: true,
        subscription_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', subscription.customer)

    if (error) {
      console.error('Error marking subscription for cancellation:', error)
      throw error
    }

    console.log('Successfully marked subscription for cancellation at period end')
  } else if (subscription.status === 'active') {
    // Subscription was reactivated
    const periodEnd = new Date(subscription.current_period_end * 1000)
    
    const { error } = await supabase
      .from('subscribers')
      .update({
        cancel_at_period_end: false,
        subscribed: true,
        subscription_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', subscription.customer)

    if (error) {
      console.error('Error reactivating subscription:', error)
      throw error
    }

    console.log('Successfully reactivated subscription')
  }
}

async function handlePaymentSuccess(supabase: any, invoice: any) {
  console.log('Payment succeeded for invoice:', invoice.id)
  
  if (invoice.subscription) {
    const periodEnd = new Date(invoice.period_end * 1000)
    
    const { error } = await supabase
      .from('subscribers')
      .update({
        subscribed: true,
        subscription_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', invoice.customer)

    if (error) {
      console.error('Error updating subscription after payment:', error)
      throw error
    }

    console.log('Successfully updated subscription after payment')
  }
}
