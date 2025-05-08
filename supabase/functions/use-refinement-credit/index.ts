
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
    const { userId, jobId } = await req.json();
    console.log(`Processing refinement credit usage for user: ${userId}, job: ${jobId}`);

    // Validate input data
    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userId is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobId || typeof jobId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'jobId is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Check if user has available credits
    const { data: creditData, error: creditError } = await supabaseClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (creditError) {
      console.error("Error checking user credits:", creditError);
      return new Response(
        JSON.stringify({ error: 'Failed to check credit balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!creditData || creditData.credits < 1) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          message: 'You need at least 1 credit to continue refining your image.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. First retrieve the job to make sure it exists
    const { data: jobData, error: jobError } = await supabaseClient
      .from('jobs')
      .select('id, iterations')
      .eq('id', jobId)
      .eq('user_id', userId)  // Verify the job belongs to the user
      .single();

    if (jobError || !jobData) {
      console.error("Error fetching job:", jobError);
      return new Response(
        JSON.stringify({ error: 'Job not found or does not belong to user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start a database transaction to ensure both operations succeed or fail together
    // Since Supabase Edge Functions don't support native transactions yet, we'll use separate calls
    // but handle errors carefully

    // 3. Deduct one credit from user
    const { error: deductCreditError } = await supabaseClient
      .from('user_credits')
      .update({ 
        credits: creditData.credits - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (deductCreditError) {
      console.error("Error deducting credit:", deductCreditError);
      return new Response(
        JSON.stringify({ error: 'Failed to deduct credit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Reset the iteration counter
    const { error: resetIterationError } = await supabaseClient
      .from('jobs')
      .update({ iterations: 0 })
      .eq('id', jobId);

    if (resetIterationError) {
      console.error("Error resetting iteration counter:", resetIterationError);
      
      // If we failed to reset the counter, try to refund the credit
      await supabaseClient
        .from('user_credits')
        .update({ 
          credits: creditData.credits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      return new Response(
        JSON.stringify({ error: 'Failed to reset iteration counter' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Get the updated credit balance
    const { data: updatedCreditData, error: updatedCreditError } = await supabaseClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (updatedCreditError) {
      console.error("Error fetching updated credit balance:", updatedCreditError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credit used successfully. You can now continue refining your image.',
        creditsRemaining: updatedCreditData?.credits || (creditData.credits - 1),
        iterationsReset: true
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
