
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { handleOptionsRequest, checkRateLimit, getRateLimitResponse } from "../_shared/security.ts";
import { getEdgeFunctionConfig } from "../_shared/config.ts";

/**
 * Edge function that handles callbacks from n8n workflows
 * This function receives updates from various n8n workflows and updates the job status in the database
 */
serve(async (req) => {
  // Get the client IP for rate limiting
  const clientIP = req.headers.get('CF-Connecting-IP') || 
                req.headers.get('X-Forwarded-For')?.split(',')[0] ||
                '127.0.0.1';
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest(req);
  }

  // Apply rate limiting
  if (!checkRateLimit(clientIP, 180)) { // Higher limit for n8n callbacks (180 requests/minute)
    return getRateLimitResponse();
  }

  try {
    // Check webhook authentication
    const webhookToken = req.headers.get('x-webhook-token');
    const config = getEdgeFunctionConfig();
    
    // Verify the token if configured
    if (config.n8nWebhookSecretToken) {
      if (webhookToken !== config.n8nWebhookSecretToken) {
        console.error("Invalid webhook token");
        return new Response(
          JSON.stringify({ error: 'Invalid webhook token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Parse the request body
    const payload = await req.json();
    console.log("Received n8n webhook callback:", JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.jobId || !payload.operation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: jobId and operation are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey
    );

    // Process based on operation type
    switch (payload.operation) {
      case 'model_generation_complete':
        return await handleModelGeneration(supabase, payload);
      
      case 'image_refinement_complete':
        return await handleImageRefinement(supabase, payload);
      
      case 'status_update':
        return await handleStatusUpdate(supabase, payload);
      
      case 'error':
        return await handleError(supabase, payload);
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${payload.operation}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error("Unexpected error in n8n callback handler:", error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handles successful model generation completion
 */
async function handleModelGeneration(supabase, payload) {
  const { jobId, modelUrl, status = 'completed', message } = payload;
  
  console.log(`Processing model generation completion for job ${jobId}`);
  
  if (!modelUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing modelUrl in model_generation_complete payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Update job with model URL and completed status
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        model_url: modelUrl, 
        status: status,
        iterations: payload.iterations || 1
      })
      .eq('id', jobId)
      .select('id, status, model_url')
      .single();

    if (error) {
      console.error("Database error updating job after model generation:", error);
      
      return new Response(
        JSON.stringify({ error: 'Database error occurred', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log successful update
    console.log(`Successfully updated job ${jobId} with model URL: ${modelUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Model generation recorded successfully', 
        job: data 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`Error handling model generation for job ${jobId}:`, error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process model generation completion' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handles successful image refinement completion
 */
async function handleImageRefinement(supabase, payload) {
  const { jobId, imageUrl, status = 'refined', message } = payload;
  
  console.log(`Processing image refinement completion for job ${jobId}`);
  
  if (!imageUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing imageUrl in image_refinement_complete payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Update job with new image URL and refined status
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        image_url: imageUrl, 
        status: status,
        iterations: payload.iterations || 1
      })
      .eq('id', jobId)
      .select('id, status, image_url, iterations')
      .single();

    if (error) {
      console.error("Database error updating job after image refinement:", error);
      
      return new Response(
        JSON.stringify({ error: 'Database error occurred', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log successful update
    console.log(`Successfully updated job ${jobId} with refined image URL: ${imageUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image refinement recorded successfully', 
        job: data 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`Error handling image refinement for job ${jobId}:`, error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process image refinement completion' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handles general status updates from n8n workflows
 */
async function handleStatusUpdate(supabase, payload) {
  const { jobId, status, message, progress } = payload;
  
  if (!status) {
    return new Response(
      JSON.stringify({ error: 'Missing status in status_update payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Processing status update for job ${jobId}: ${status}`);

  try {
    // Prepare update object
    const updateData = { status };
    
    // Add additional fields if provided
    if (payload.imageUrl) updateData.image_url = payload.imageUrl;
    if (payload.modelUrl) updateData.model_url = payload.modelUrl;
    if (payload.iterations) updateData.iterations = payload.iterations;

    // Update job status
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select('id, status')
      .single();

    if (error) {
      console.error("Database error updating job status:", error);
      
      return new Response(
        JSON.stringify({ error: 'Database error occurred', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log successful update
    console.log(`Successfully updated job ${jobId} status to: ${status}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Status updated successfully', 
        job: data 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`Error handling status update for job ${jobId}:`, error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process status update' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handles error notifications from n8n workflows
 */
async function handleError(supabase, payload) {
  const { jobId, errorMessage, errorCode, errorStep } = payload;
  
  console.log(`Processing error for job ${jobId}: ${errorMessage}`);

  try {
    // Update job with error status and metadata
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'error',
        // We could consider adding a JSON column in the future for detailed error metadata
      })
      .eq('id', jobId)
      .select('id, status')
      .single();

    if (error) {
      console.error("Database error updating job with error status:", error);
      
      return new Response(
        JSON.stringify({ error: 'Database error occurred', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log the error details
    console.error(`Job ${jobId} failed: ${errorMessage}`, {
      errorCode,
      errorStep,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Error recorded successfully', 
        job: data 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`Error handling error notification for job ${jobId}:`, error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process error notification' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
