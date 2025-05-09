
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders, getEdgeFunctionConfig } from "../_shared/config.ts";
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
    
    if (!meshyApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'MESHY_API_KEY is not configured',
          details: 'The server is missing the Meshy API key configuration. Please contact support.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    
    // Get job details to retrieve the Meshy task ID
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
    
    // Check if the jobs table has a metadata column
    const hasMetadataColumn = await columnExists(supabase, 'jobs', 'metadata');
    console.log(`Metadata column exists: ${hasMetadataColumn}`);
    
    let meshyTaskId = null;
    
    // Only try to access metadata if the column exists
    if (hasMetadataColumn && job.metadata && typeof job.metadata === 'object') {
      meshyTaskId = job.metadata.meshy_task_id || null;
      console.log(`Found Meshy task ID in metadata: ${meshyTaskId}`);
    } else {
      console.log('Could not access metadata, it may not exist as a column yet');
    }
    
    // If no task ID is found, provide a simplified response
    if (!meshyTaskId) {
      console.log('No Meshy task ID found, returning current job status');
      // Return current job status if available
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: job.status || 'pending',
          modelUrl: job.model_url,
          estimatedTimeRemaining: '1-3 minutes'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check Meshy task status
    console.log(`Checking status for Meshy task ID: ${meshyTaskId}`);
    const meshyStatusResponse = await fetch(`https://api.meshy.ai/v1/tasks/${meshyTaskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${meshyApiKey}`
      }
    });
    
    if (!meshyStatusResponse.ok) {
      const errorText = await meshyStatusResponse.text();
      console.error(`Meshy API error: ${meshyStatusResponse.status} - ${errorText}`);
      
      // If there's an API error, return the current job status from our database
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: job.status,
          modelUrl: job.model_url,
          meshyTaskId: meshyTaskId,
          apiError: `Meshy API error: ${meshyStatusResponse.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const taskData = await meshyStatusResponse.json();
    console.log(`Current Meshy task status: ${taskData.status}`);

    // Handle the case where we have results directly
    let downloadUrl = null;
    
    // Check for various possible response formats
    if (taskData.status === 'completed') {
      // Try to get the download URL from different possible fields
      downloadUrl = taskData.result?.download_url || 
                   taskData.results?.stl_url || 
                   taskData.results?.glb_url ||
                   taskData.results?.model_url || 
                   taskData.download_url;
                    
      console.log(`Found download URL: ${downloadUrl}`);
    }
    
    // If model generation is complete and we have a download URL
    if (taskData.status === 'completed' && downloadUrl) {
      const modelUrl = downloadUrl;
      
      // Download the STL file from Meshy
      const modelResponse = await fetch(modelUrl);
      if (!modelResponse.ok) {
        throw new Error(`Failed to download model file: ${modelResponse.status}`);
      }
      
      const modelBuffer = await modelResponse.arrayBuffer();
      
      // Check if the "models" storage bucket exists, create if needed
      const { data: bucketList } = await supabase
        .storage
        .listBuckets();
      
      const modelsBucketExists = bucketList?.some(bucket => bucket.name === 'models');
      
      if (!modelsBucketExists) {
        const { error: bucketError } = await supabase
          .storage
          .createBucket('models', { public: true });
          
        if (bucketError) {
          console.error('Error creating models storage bucket:', bucketError);
        }
      }
      
      // Upload the model file to our Supabase storage
      const filePath = `${jobId}/${jobId}.stl`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('models')
        .upload(filePath, modelBuffer, {
          contentType: 'model/stl',
          upsert: true
        });
        
      if (uploadError) {
        throw new Error(`Failed to upload model to storage: ${uploadError.message}`);
      }
      
      // Get public URL for the uploaded model
      const { data: publicUrlData } = supabase
        .storage
        .from('models')
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      
      // Update job with model URL and set status to 'completed'
      const { error: completeError } = await supabase
        .from('jobs')
        .update({
          status: 'completed',
          model_url: publicUrl,
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
      
      console.log(`Job ${jobId} completed successfully with model URL: ${publicUrl}`);
      
      // Return success response
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'completed',
          modelUrl: publicUrl,
          meshyTaskId: meshyTaskId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If model generation failed
    if (taskData.status === 'failed') {
      // Update job status to error
      const { error: errorUpdateError } = await supabase
        .from('jobs')
        .update({
          status: 'error',
          error_message: taskData.error || 'Meshy task failed with no specific error message'
        })
        .eq('id', jobId);
      
      if (errorUpdateError) {
        console.error('Error updating job error status:', errorUpdateError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'error',
          error: taskData.error || 'Meshy task failed with no specific error message',
          meshyTaskId: meshyTaskId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Map Meshy status to progress values
    let progress = 0.1; // Default starting progress
    let estimatedTimeRemaining = '1-3 minutes';
    
    if (taskData.status === 'processing') {
      progress = 0.5;
      estimatedTimeRemaining = '1-2 minutes';
    } else if (taskData.status === 'post-processing') {
      progress = 0.8;
      estimatedTimeRemaining = 'Less than 1 minute';
    }
    
    // If still processing, return progress status
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: taskData.status,
        progress: progress,
        meshyTaskId: meshyTaskId,
        estimatedTimeRemaining: estimatedTimeRemaining
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in check-model-status function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'There was an error checking the model status. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
