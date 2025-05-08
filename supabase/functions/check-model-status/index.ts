
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import Replicate from "https://esm.sh/replicate@0.25.2";
import { corsHeaders, getEdgeFunctionConfig } from "../_shared/config.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Load configuration
    const config = getEdgeFunctionConfig();
    const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');
    
    if (!replicateApiKey) {
      throw new Error('REPLICATE_API_KEY is not configured');
    }
    
    // Parse the request body
    const { jobId } = await req.json();
    
    // Input validation
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client using configuration
    const supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey
    );
    
    // Get job details to retrieve the prediction ID
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();
    
    if (jobError) {
      console.error('Error retrieving job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve job', details: jobError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the job has metadata with a prediction ID
    // If metadata doesn't exist, use an alternative approach
    const metadata = job.metadata || {};
    const predictionId = metadata.prediction_id;
    
    // If no prediction ID is found, provide a simplified response
    if (!predictionId) {
      // Return current job status if available
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: job.status || 'pending',
          modelUrl: job.model_url,
          estimatedTimeRemaining: '5-7 minutes'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Replicate client
    const replicate = new Replicate({
      auth: replicateApiKey,
    });
    
    // Check prediction status
    console.log(`Checking status for prediction ID: ${predictionId}`);
    const prediction = await replicate.predictions.get(predictionId);
    console.log(`Current prediction status: ${prediction.status}`);
    
    // If prediction is successful and has output
    if (prediction.status === 'succeeded' && prediction.output) {
      const modelUrl = prediction.output;
      
      // Update job with model URL and set status to 'completed'
      const { error: completeError } = await supabase
        .from('jobs')
        .update({
          status: 'completed',
          model_url: modelUrl,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      if (completeError) {
        console.error('Error updating job completion:', completeError);
        return new Response(
          JSON.stringify({ error: 'Failed to update job completion status', details: completeError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Job ${jobId} completed successfully with model URL: ${modelUrl}`);
      
      // Return success response
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'completed',
          modelUrl: modelUrl,
          predictionId: predictionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If prediction failed
    if (prediction.status === 'failed') {
      // Update job status to error
      const { error: errorUpdateError } = await supabase
        .from('jobs')
        .update({
          status: 'error',
          error_message: prediction.error || 'Prediction failed with no specific error message'
        })
        .eq('id', jobId);
      
      if (errorUpdateError) {
        console.error('Error updating job error status:', errorUpdateError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'error',
          error: prediction.error || 'Prediction failed with no specific error message',
          predictionId: predictionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If still processing
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: prediction.status,
        progress: prediction.status === 'processing' ? 0.5 : 0.3, // Approximate progress indicator
        predictionId: predictionId,
        estimatedTimeRemaining: prediction.status === 'processing' ? '3-5 minutes' : '5-7 minutes'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in check-model-status function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
