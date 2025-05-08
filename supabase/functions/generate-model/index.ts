
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders, getEdgeFunctionConfig } from "../_shared/config.ts";
import { isValidURL } from "../_shared/validators.ts";

// Define the Replicate API client
interface ReplicateOptions {
  auth: string;
}

interface PredictionResponse {
  id: string;
  version: string;
  urls: {
    get: string;
    cancel: string;
  };
  status: string;
  created_at: string;
  completed_at?: string;
  output?: string[];
  error?: string;
}

class Replicate {
  private baseUrl = "https://api.replicate.com/v1";
  private headers: HeadersInit;

  constructor(options: ReplicateOptions) {
    this.headers = {
      Authorization: `Token ${options.auth}`,
      "Content-Type": "application/json",
    };
  }

  async createPrediction(version: string, input: Record<string, unknown>): Promise<PredictionResponse> {
    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        version,
        input,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${error.detail || response.statusText}`);
    }

    return await response.json();
  }

  async getPrediction(id: string): Promise<PredictionResponse> {
    const response = await fetch(`${this.baseUrl}/predictions/${id}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${error.detail || response.statusText}`);
    }

    return await response.json();
  }
}

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
    
    try {
      console.log(`Starting 3D model generation using Replicate for job ${jobId}`);
      
      // Initialize Replicate client
      const replicate = new Replicate({
        auth: replicateApiKey,
      });
      
      // Fetch the prompt from the job record to use for model generation
      const prompt = job.prompt || "3D model based on the provided image";
      
      // Create a prediction with Replicate's Shap-E model
      const prediction = await replicate.createPrediction(
        "38fbf344b123c8c2fc742c1f13e45b8c550f9b0b736d7c96acfb5a004fe77f3b", 
        {
          image: imageUrl,
          guidance_scale: 15.0
        }
      );
      
      console.log(`Replicate prediction started with ID: ${prediction.id}`);
      
      // Update job with prediction ID for status tracking
      const { error: predictionUpdateError } = await supabase
        .from('jobs')
        .update({
          status: 'rendering',
          // Store prediction ID in job metadata for future reference
          metadata: { 
            prediction_id: prediction.id,
            started_at: new Date().toISOString()
          }
        })
        .eq('id', jobId);
      
      if (predictionUpdateError) {
        throw new Error(`Failed to update job with prediction ID: ${predictionUpdateError.message}`);
      }
      
      // Check if the prediction is already complete (unlikely but possible)
      if (prediction.status === 'succeeded' && prediction.output && prediction.output.length > 0) {
        // The model is already generated, update job status
        const modelUrl = prediction.output[0];
        
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
          throw new Error(`Failed to update job completion: ${completeError.message}`);
        }
        
        console.log(`Job ${jobId} completed immediately with model URL: ${modelUrl}`);
        
        // Return success response
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Model generation completed successfully',
            job: {
              id: job.id,
              status: 'completed',
              modelUrl: modelUrl,
              estimatedTime: 0,
              predictionId: prediction.id
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return response with prediction ID for status polling
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Model generation started successfully',
          job: {
            id: job.id,
            status: 'rendering',
            estimatedTime: '5-7 minutes',
            predictionId: prediction.id
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (apiError) {
      console.error('Error in Replicate model generation:', apiError);
      
      // Update job status to error
      await supabase
        .from('jobs')
        .update({ 
          status: 'error',
          error_message: apiError.message || 'Unknown error during model generation' 
        })
        .eq('id', jobId);
      
      return new Response(
        JSON.stringify({ error: 'Replicate model generation failed', details: apiError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in generate-model function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
