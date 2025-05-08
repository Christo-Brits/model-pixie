
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
    // Get the config
    const config = getEdgeFunctionConfig();
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }

    // Create Supabase client using auth from request
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    // Get the request body
    const { packageId } = await req.json();

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract token from Authorization header
    const token = authHeader.replace("Bearer ", "");
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine package details based on packageId
    let amount = 0;
    let creditAmount = 0;
    let packageName = "";

    switch (packageId) {
      case "package1":
        amount = 500; // $5.00 in cents
        creditAmount = 1;
        packageName = "1 ModelPixie Credit";
        break;
      case "package2":
        amount = 2000; // $20.00 in cents
        creditAmount = 5;
        packageName = "5 ModelPixie Credits";
        break;
      case "package3":
        amount = 5000; // $50.00 in cents
        creditAmount = 15;
        packageName = "15 ModelPixie Credits";
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid package selected" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Initialize Stripe with the secret key
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2022-11-15", // Use the appropriate API version
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Check if user already exists as a Stripe customer
    const { data: customers } = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId = null;
    if (customers && customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create a new customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: packageName,
              description: `${creditAmount} credit${creditAmount > 1 ? "s" : ""} for 3D model generation`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin") || "https://app.modelpixie.ai"}/credits?success=true`,
      cancel_url: `${req.headers.get("origin") || "https://app.modelpixie.ai"}/credits?canceled=true`,
      metadata: {
        user_id: user.id,
        credits_purchased: creditAmount,
      },
    });

    // Create a payment record in the database
    const { data: payment, error: paymentError } = await supabase
      .from("payment_history")
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: amount,
        credits_purchased: creditAmount,
        status: "pending",
      })
      .select();

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      // Continue anyway as this shouldn't block the checkout process
    } else {
      console.log(`Created payment record for user ${user.id}: ${payment[0].id}`);
    }

    // Return the checkout URL
    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
