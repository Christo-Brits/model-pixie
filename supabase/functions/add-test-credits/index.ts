
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if request method is POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, credits = 10 } = await req.json();
    console.log(`Adding ${credits} test credits for user: ${userId}`);

    // Validate input data
    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userId is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof credits !== 'number' || credits <= 0) {
      return new Response(
        JSON.stringify({ error: 'credits must be a positive number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user exists in user_credits table
    const { data: userData, error: userError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error("Database error when checking user credits:", userError);
      return new Response(
        JSON.stringify({ error: 'Failed to check user existence' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    if (!userData) {
      // User doesn't have a credits record yet, create one
      const { data: insertData, error: insertError } = await supabaseClient
        .from('user_credits')
        .insert([{ 
          user_id: userId, 
          credits: credits,
        }])
        .select();

      if (insertError) {
        console.error("Error creating user credits record:", insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user credits record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      result = insertData?.[0];
    } else {
      // User exists, update their credits
      const { data: updateData, error: updateError } = await supabaseClient
        .from('user_credits')
        .update({ 
          credits: userData.credits + credits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      if (updateError) {
        console.error("Error updating user credits:", updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      result = updateData?.[0];
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully added ${credits} test credits to user account`,
        data: result
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
