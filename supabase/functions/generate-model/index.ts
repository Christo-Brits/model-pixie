
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
    const requestData = await req.json();
    console.log("Received generate model request:", requestData);

    // Validate input data
    const { jobId, imageUrl } = requestData;
    
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

    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'imageUrl is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format for imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Retrieve the job from the database to check if it exists
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

    console.log(`Job ${jobId} status transitioning from ${jobData.status} to processing`);

    // Update job status in the database
    const { error: updateError } = await supabaseClient
      .from('jobs')
      .update({ 
        status: 'processing',
        image_url: imageUrl
      })
      .eq('id', jobId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update job status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward payload to n8n webhook
    try {
      const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || 'https://your-n8n-domain/webhook/modelpixie-shape';
      
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobId,
          imageUrl: imageUrl
        }),
      });

      if (!n8nResponse.ok) {
        console.error("n8n webhook error:", await n8nResponse.text());
        // We don't want to fail the request if the n8n webhook fails
        // Just log it and continue
      } else {
        console.log("Successfully forwarded to n8n webhook");
      }
    } catch (webhookError) {
      console.error("Error forwarding to n8n webhook:", webhookError);
      // We still don't want to fail the request if the n8n webhook fails
      // Just log it and continue
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Model generation request processed successfully',
        job: {
          id: jobId,
          status: 'processing',
          image_url: imageUrl
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error in generate-model function:", error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
