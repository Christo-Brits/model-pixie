
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ITERATIONS = 4;

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
    const requestData = await req.json();
    console.log("Received image refinement request:", requestData);

    // Validate input data
    const { jobId, editInstructions } = requestData;
    
    if (!jobId || typeof jobId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'jobId is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid UUID format for jobId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!editInstructions || typeof editInstructions !== 'string') {
      return new Response(
        JSON.stringify({ error: 'editInstructions is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Retrieve the job from the database
    const { data: jobData, error: fetchError } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !jobData) {
      console.error("Database fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if iterations limit reached
    const currentIterations = jobData.iterations || 0;
    if (currentIterations >= MAX_ITERATIONS) {
      return new Response(
        JSON.stringify({ error: 'Maximum refinement iterations reached (limit: 4)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update iterations count in the database
    const newIterationsCount = currentIterations + 1;
    const { error: updateError } = await supabaseClient
      .from('jobs')
      .update({ 
        iterations: newIterationsCount,
        status: 'refining' 
      })
      .eq('id', jobId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update job iterations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward payload to n8n webhook
    try {
      const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || 'https://your-n8n-domain/webhook/modelpixie-refine';
      
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobId,
          editInstructions: editInstructions,
          iterations: newIterationsCount
        }),
      });

      if (!n8nResponse.ok) {
        console.error("n8n webhook error:", await n8nResponse.text());
        // We don't want to fail the request if the n8n webhook fails
        // Just log it and continue
      }
    } catch (webhookError) {
      console.error("Error forwarding to n8n webhook:", webhookError);
      // We still don't want to fail the request if the n8n webhook fails
      // Just log it and continue
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Refinement request processed successfully',
        job: {
          id: jobId,
          iterations: newIterationsCount,
          status: 'refining'
        }
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
