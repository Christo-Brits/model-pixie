
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
    const meshyApiKey = Deno.env.get('MESHY_API_KEY');
    
    if (!meshyApiKey) {
      throw new Error('MESHY_API_KEY is not configured');
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
      console.log(`Starting 3D model generation using Meshy AI for job ${jobId}`);
      
      // Prepare Meshy API request with proper error handling
      try {
        // Call Meshy AI API to initiate 3D model generation
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
        
        if (!meshyResponse.ok) {
          const errorData = await meshyResponse.text();
          let errorMessage = `Meshy API error: ${meshyResponse.status}`;
          try {
            const errorJson = JSON.parse(errorData);
            errorMessage += ` - ${errorJson.error || errorJson.message || errorData}`;
          } catch {
            errorMessage += ` - ${errorData}`;
          }
          throw new Error(errorMessage);
        }
        
        const meshyData = await meshyResponse.json();
        console.log('Meshy API response:', JSON.stringify(meshyData));
        
        // We need the taskId for status checking
        const taskId = meshyData.task_id;
        
        if (!taskId) {
          throw new Error('Meshy API did not return a task_id');
        }
        
        console.log(`Meshy AI task initiated with ID: ${taskId}`);
        
        // Create metadata object
        const metadata = { 
          meshy_task_id: taskId,
          started_at: new Date().toISOString()
        };
        
        // First try to determine if the metadata column exists
        let hasMetadataColumn = true;
        try {
          // Test if we can get the metadata column
          const { data: metadataTest, error: metadataTestError } = await supabase
            .from('jobs')
            .select('metadata')
            .eq('id', jobId)
            .limit(1);
            
          if (metadataTestError && metadataTestError.message.includes("column 'metadata' does not exist")) {
            hasMetadataColumn = false;
            console.log('Metadata column does not exist, will not try to update it');
          }
        } catch (testError) {
          console.error('Error testing for metadata column:', testError);
          hasMetadataColumn = false;
        }
        
        try {
          // Try updating with or without metadata based on column existence
          if (hasMetadataColumn) {
            const { error: taskUpdateError } = await supabase
              .from('jobs')
              .update({
                status: 'rendering',
                metadata: metadata
              })
              .eq('id', jobId);
              
            if (taskUpdateError) {
              console.error('Error updating job with metadata:', taskUpdateError);
              // Fall back to status-only update
              await supabase
                .from('jobs')
                .update({ status: 'rendering' })
                .eq('id', jobId);
            }
          } else {
            // Just update the status if metadata column doesn't exist
            await supabase
              .from('jobs')
              .update({ status: 'rendering' })
              .eq('id', jobId);
          }
        } catch (updateError) {
          console.error('Error updating job:', updateError);
          // Make sure at least the status is updated
          try {
            await supabase
              .from('jobs')
              .update({ status: 'rendering' })
              .eq('id', jobId);
          } catch (finalError) {
            console.error('Even status update failed:', finalError);
          }
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
              taskId: taskId
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
