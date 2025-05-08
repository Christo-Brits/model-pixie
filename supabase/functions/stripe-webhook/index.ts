
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getEdgeFunctionConfig, corsHeaders } from "../_shared/config.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const config = getEdgeFunctionConfig();
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }

    // Create Supabase client using service key to bypass RLS
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    // Get the signature from the header
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response(
        JSON.stringify({ error: "No Stripe signature found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body as text for signature verification
    const body = await req.text();
    
    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    });

    let event;

    // Verify the webhook signature if webhook secret is available
    if (STRIPE_WEBHOOK_SECRET) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          sig,
          STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(
          JSON.stringify({ error: `Webhook signature verification failed` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // If no webhook secret is set, parse the event without verification
      // WARNING: This is not recommended for production
      event = JSON.parse(body);
      console.warn("Processing webhook without signature verification");
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // Extract session metadata
      const userId = session.metadata?.user_id;
      const creditsPurchased = parseInt(session.metadata?.credits_purchased || "0", 10);
      
      if (!userId || !creditsPurchased) {
        throw new Error("Missing user ID or credits in session metadata");
      }
      
      console.log(`Processing successful payment for user ${userId}: ${creditsPurchased} credits`);

      // Update payment status
      const { error: paymentUpdateError } = await supabase
        .from("payment_history")
        .update({
          status: "completed",
          stripe_payment_intent_id: session.payment_intent,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_session_id", session.id);

      if (paymentUpdateError) {
        console.error("Error updating payment record:", paymentUpdateError);
      }

      // Check if user already has credits
      const { data: existingCredits } = await supabase
        .from("user_credits")
        .select()
        .eq("user_id", userId)
        .single();

      if (existingCredits) {
        // Update existing credits
        const { error: updateError } = await supabase
          .from("user_credits")
          .update({
            credits: existingCredits.credits + creditsPurchased,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (updateError) {
          throw new Error(`Failed to update user credits: ${updateError.message}`);
        }
      } else {
        // Insert new credits record
        const { error: insertError } = await supabase
          .from("user_credits")
          .insert({
            user_id: userId,
            credits: creditsPurchased,
          });

        if (insertError) {
          throw new Error(`Failed to insert user credits: ${insertError.message}`);
        }
      }

      console.log(`Successfully added ${creditsPurchased} credits to user ${userId}`);
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
