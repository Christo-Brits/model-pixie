
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
    console.log("Received job creation request:", requestData);

    // Validate input data
    const { prompt, userId } = requestData;
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'User ID is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert job into database
    const { data: jobData, error: dbError } = await supabaseClient
      .from('jobs')
      .insert({
        user_id: userId,
        prompt: prompt,
        status: 'queued'
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to create job in database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward payload to n8n webhook
    try {
      const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || 'https://your-n8n-domain/webhook/modelpixie-create';
      
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobData.id,
          prompt: prompt,
          userId: userId,
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

    // Return success response with the created job data
    return new Response(
      JSON.stringify({
        message: 'Job created successfully',
        job: jobData
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
