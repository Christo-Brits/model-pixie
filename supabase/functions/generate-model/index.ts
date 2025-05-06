
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders, getEdgeFunctionConfig } from "../_shared/config.ts";
import { isValidURL } from "../_shared/validators.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Load configuration
    const config = getEdgeFunctionConfig();
    
    // Parse the request body
    const { jobId, imageUrl } = await req.json();
    
    // Input validation
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate URL format
    if (!isValidURL(imageUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid imageUrl format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client using configuration
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey
    );
    
    // Update job status to 'processing'
    const { data: job, error: updateError } = await supabase
      .from('jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error updating job status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update job status', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log the job status transition
    console.log(`Job ${jobId} status updated to 'processing'`);
    
    // Forward the request to the n8n webhook
    try {
      const n8nResponse = await fetch(config.n8nModelGenerationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          imageUrl,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!n8nResponse.ok) {
        console.error(`N8n webhook returned status: ${n8nResponse.status}`);
        // We don't fail the request here, as the job is already in 'processing' state
        // The job status will be updated by the n8n workflow or status check endpoint
      } else {
        console.log(`Successfully forwarded request to n8n webhook for job ${jobId}`);
      }
    } catch (webhookError) {
      console.error('Error calling n8n webhook:', webhookError);
      // We don't fail the request here, as the job is already in 'processing' state
      // The job status will be updated by the n8n workflow or status check endpoint
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Model generation started',
        job: {
          id: job.id,
          status: job.status,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-model function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
