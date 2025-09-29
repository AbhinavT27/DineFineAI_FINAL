import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      // Store customer info in Stripe Customers table and update subscribers table
      await supabaseClient.from("Customers").upsert({
        email: user.email,
        id: null, // No stripe customer ID yet
        attrs: { user_id: user.id, subscription_tier: 'free' }
      }, { onConflict: 'email' });

      // Update the main subscribers table to reflect free tier status
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null,
        stripe_customer_id: null
      }, { onConflict: 'email' });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'free',
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Store customer info in Stripe Customers table
    await supabaseClient.from("Customers").upsert({
      id: customerId,
      email: user.email,
      name: customers.data[0].name,
      description: customers.data[0].description,
      created: customers.data[0].created ? new Date(customers.data[0].created * 1000) : null,
      attrs: { user_id: user.id }
    }, { onConflict: 'id' });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });
    // Only consider active and trialing subscriptions as valid AND not cancelled
    const subscription = subscriptions.data.find((s: any) => 
      ["active", "trialing"].includes(s.status) && !s.cancel_at_period_end
    );
    const hasActiveSub = !!subscription;
    let subscriptionTier = 'free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active/trialing subscription found", { subscriptionId: subscription.id, status: subscription.status, endDate: subscriptionEnd });
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      if (amount <= 599) {
        subscriptionTier = "pro";
      } else if (amount <= 1099) {
        subscriptionTier = "premium";
      } else {
        subscriptionTier = "premium"; // Default for higher amounts
      }
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });

      // Update both Stripe Subscribers and main subscribers table
      await supabaseClient.from("Subscribers").upsert({
        id: subscription.id,
        customer: customerId,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        currency: subscription.currency,
        attrs: { 
          user_id: user.id, 
          subscription_tier: subscriptionTier,
          status: subscription.status
        }
      }, { onConflict: 'id' });

      // Track trial history if this is a trial subscription
      let trialHistory = [];
      if (subscription.status === "trialing") {
        const { data: existingRecord } = await supabaseClient
          .from("subscribers")
          .select("trial_history")
          .eq("email", user.email)
          .single();
        
        trialHistory = existingRecord?.trial_history || [];
        
        // Check if this trial is already recorded
        const existingTrial = trialHistory.find((trial: any) => 
          trial.subscription_id === subscription.id
        );
        
        if (!existingTrial) {
          trialHistory.push({
            plan: subscriptionTier,
            subscription_id: subscription.id,
            start: new Date(subscription.trial_start * 1000).toISOString(),
            end: new Date(subscription.trial_end * 1000).toISOString(),
            status: "active"
          });
          logStep("Trial history updated", { trialHistory });
        }
      }

      // Update the main subscribers table that the frontend reads from
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        subscribed: true,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        stripe_customer_id: customerId,
        trial_history: trialHistory
      }, { onConflict: 'email' });
    } else {
      logStep("No active or trialing subscription found");
      
      // Check for any past trials to preserve trial history
      const { data: existingRecord } = await supabaseClient
        .from("subscribers")
        .select("trial_history")
        .eq("email", user.email)
        .single();
      
      let trialHistory = existingRecord?.trial_history || [];
      
      // Check if user had trials that ended - mark them as completed
      if (subscriptions.data.length > 0) {
        for (const pastSubscription of subscriptions.data) {
          if (pastSubscription.status === "canceled" && pastSubscription.trial_end) {
            const existingTrialIndex = trialHistory.findIndex((trial: any) => 
              trial.subscription_id === pastSubscription.id
            );
            
            if (existingTrialIndex >= 0 && trialHistory[existingTrialIndex].status === "active") {
              trialHistory[existingTrialIndex].status = "completed";
              logStep("Marked trial as completed", { subscriptionId: pastSubscription.id });
            }
          }
        }
      }
      
      // Update the subscribers table to reflect free tier status
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null,
        stripe_customer_id: customerId,
        trial_history: trialHistory
      }, { onConflict: 'email' });
    }

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});