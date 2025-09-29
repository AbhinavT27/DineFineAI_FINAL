import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create a Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { plan_type = "pro" } = await req.json().catch(() => ({ plan_type: "pro" }));
    logStep("Plan type received", { plan_type });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists and their trial history
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    let hasHadTrial = false;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
      
      // Check trial history from our database
      const { data: subscriberData } = await supabaseClient
        .from("subscribers")
        .select("trial_history")
        .eq("email", user.email)
        .single();
      
      if (subscriberData?.trial_history) {
        hasHadTrial = subscriberData.trial_history.some((trial: any) => 
          trial.plan === plan_type
        );
        logStep("Trial history checked", { hasHadTrial, planType: plan_type });
      }
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    // Create checkout session with or without trial based on history
    const sessionData: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan_type === 'pro' 
            ? Deno.env.get("STRIPE_PRO_PRICE_ID") 
            : Deno.env.get("STRIPE_PREMIUM_PRICE_ID"),
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/current-plan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan_type: plan_type
      }
    };

    // Only add trial if user hasn't had one before for this plan
    if (!hasHadTrial) {
      sessionData.subscription_data = {
        trial_period_days: 7
      };
      logStep("Adding 7-day trial for new user");
    } else {
      logStep("Skipping trial - user has already had trial for this plan");
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    
    logStep("Checkout session created", { sessionId: session.id, hasTrialIncluded: !hasHadTrial });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
