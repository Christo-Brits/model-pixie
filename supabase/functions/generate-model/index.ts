
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders, getEdgeFunctionConfig } from "../_shared/config.ts";
import { isValidURL } from "../_shared/validators.ts";
import { columnExists } from "../_shared/database.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Load configuration
    const config = getEdgeFunctionConfig();
    const meshyApiKey = Deno.env.get('MESHY_API_KEY');
    
    console.log("Meshy API Key present:", !!meshyApiKey);
    console.log("Meshy API Key first 4 chars:", meshyApiKey ? meshyApiKey.substring(0, 4) : "None");
    
    if (!meshyApiKey) {
      console.error('MESHY_API_KEY is not configured in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'MESHY_API_KEY is not configured', 
          details: 'The server is missing the required API key for Meshy integration' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request body
    const { jobId, imageUrl } = await req.json();
    
    console.log(`Generate model request for job ${jobId} with image URL:`, 
      imageUrl ? `${imageUrl.substring(0, 50)}...` : "No image URL");
    
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
      console.error(`Invalid image URL format: ${imageUrl}`);
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
      console.log(`Starting 3D model generation using Meshy AI for job ${jobId}`);
      
      // Prepare Meshy API request with proper error handling
      try {
        // Call Meshy AI API to initiate 3D model generation
        console.log('Sending request to Meshy API at https://api.meshy.ai/v1/image-to-3d with image URL:', 
          imageUrl.substring(0, 50) + "...");
          
        console.log('Request payload:', JSON.stringify({
          image_url: imageUrl,
          generation_type: "mesh",
          output_format: "stl"
        }));
        
        const meshyResponse = await fetch('https://api.meshy.ai/v1/image-to-3d', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${meshyApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image_url: imageUrl,
            generation_type: "mesh",
            output_format: "stl"
          })
        });
        
        console.log(`Meshy API response status: ${meshyResponse.status}`);
        
        if (!meshyResponse.ok) {
          const errorText = await meshyResponse.text();
          console.error(`Meshy API error response (${meshyResponse.status}):`, errorText);
          
          let errorMessage = `Meshy API error: ${meshyResponse.status}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage += ` - ${errorJson.error || errorJson.message || errorText}`;
          } catch {
            errorMessage += ` - ${errorText}`;
          }
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
        
        const responseText = await meshyResponse.text();
        console.log("Meshy raw response:", responseText);
        
        let meshyData;
        try {
          meshyData = JSON.parse(responseText);
          console.log('Meshy API parsed response:', JSON.stringify(meshyData));
        } catch (e) {
          console.error("Failed to parse Meshy API response:", e);
          throw new Error("Invalid JSON response from Meshy API");
        }
        
        // We can get either task_id or result as the task identifier
        const taskId = meshyData.task_id || meshyData.result;
        
        if (!taskId) {
          console.error('No task identifier in Meshy API response:', meshyData);
          throw new Error('Meshy API did not return a valid task identifier');
        }
        
        console.log(`Meshy AI task initiated with ID: ${taskId}`);
        
        // Create metadata object
        const metadata = { 
          meshy_task_id: taskId,
          started_at: new Date().toISOString()
        };
        
        // Check if the metadata column exists in the jobs table
        const hasMetadataColumn = await columnExists(supabase, 'jobs', 'metadata');
        console.log(`Metadata column exists: ${hasMetadataColumn}`);
        
        try {
          // Update the job with status and optional metadata
          const updateData: Record<string, any> = { status: 'rendering' };
          
          // Only add metadata if the column exists
          if (hasMetadataColumn) {
            updateData.metadata = metadata;
          }
          
          const { error: jobUpdateError } = await supabase
            .from('jobs')
            .update(updateData)
            .eq('id', jobId);
            
          if (jobUpdateError) {
            console.error('Error updating job with metadata:', jobUpdateError);
            // Fall back to status-only update
            await supabase
              .from('jobs')
              .update({ status: 'rendering' })
              .eq('id', jobId);
          }
        } catch (updateError) {
          console.error('Error in job update:', updateError);
          // Make sure at least the status is updated
          await supabase
            .from('jobs')
            .update({ status: 'rendering' })
            .eq('id', jobId);
        }
        
        // Return response with task ID for status polling
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Model generation started successfully',
            job: {
              id: job.id,
              status: 'rendering',
              estimatedTime: '1-3 minutes',
              taskId: taskId,
              predictionId: taskId // Include as predictionId for compatibility
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (apiError) {
        console.error('Error in Meshy AI model generation:', apiError);
        
        // Update job status to error
        await supabase
          .from('jobs')
          .update({ 
            status: 'error',
            error_message: apiError.message || 'Unknown error during model generation' 
          })
          .eq('id', jobId);
        
        return new Response(
          JSON.stringify({ error: 'Meshy AI model generation failed', details: apiError.message }),
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
  } catch (error) {
    console.error('Error in generate-model function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
