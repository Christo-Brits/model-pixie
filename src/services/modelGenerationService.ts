
import { supabase } from '@/integrations/supabase/client';
import { generateMeshyModel, checkMeshyModelStatus } from './meshyApiService';
import { toast } from '@/hooks/use-toast';

/**
 * Function to generate a 3D model from an image
 * @param jobId The ID of the job
 * @param imageUrl The URL of the image to generate the model from
 */
export const generateModel = async (jobId: string, imageUrl: string) => {
  try {
    console.log(`Generating 3D model for job ${jobId} with image: ${imageUrl}`);
    
    // Get the current session asynchronously
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    // Use the public anon key
    const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w";
    
    try {
      console.log('First trying supabase.functions.invoke for generate-model');
      // First try using supabase.functions.invoke
      const { data, error } = await supabase.functions.invoke(
        'generate-model',
        {
          body: { jobId, imageUrl },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': apiKey
          }
        }
      );

      if (error) {
        console.error('Error using supabase.functions.invoke:', error);
        throw error;
      }

      console.log('Model generation response from functions.invoke:', data);
      return data;
    } catch (invokeError) {
      console.error('Failed with functions.invoke approach, trying direct fetch:', invokeError);
      
      // If that fails, fall back to direct API call
      const response = await fetch(
        'https://pvtrmpaxhbvhvdiojqkd.supabase.co/functions/v1/generate-model',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': apiKey
          },
          body: JSON.stringify({ jobId, imageUrl }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed with status ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.details || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage}: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Model generation response from direct fetch:', data);
      
      // Check for specific error about API key
      if (data.error && data.error.includes('MESHY_API_KEY')) {
        throw new Error('Meshy API key is not configured in the server. Please contact support.');
      }
      
      return data;
    }
  } catch (error: any) {
    console.error('Error generating model:', error);
    
    // Update job status to error
    try {
      await supabase
        .from('jobs')
        .update({ status: 'error', error_message: error.message })
        .eq('id', jobId);
    } catch (updateError) {
      console.error('Failed to update job status to error:', updateError);
    }
    
    throw error;
  }
};

/**
 * Function to check the status of a model generation job
 * @param jobId The ID of the job to check
 */
export const checkModelGenerationStatus = async (jobId: string): Promise<any> => {
  try {
    // Get the current session asynchronously
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    // Use the public anon key
    const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w";
    
    try {
      console.log('First trying supabase.functions.invoke for check-model-status');
      // First try using supabase.functions.invoke
      const { data, error } = await supabase.functions.invoke(
        'check-model-status',
        {
          body: { jobId },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': apiKey
          }
        }
      );

      if (error) {
        console.error('Error using supabase.functions.invoke for status check:', error);
        throw error;
      }

      console.log('Model status check response from functions.invoke:', data);
      return data;
    } catch (invokeError) {
      console.error('Failed with functions.invoke for status check, trying direct fetch:', invokeError);
      
      // If that fails, fall back to direct API call
      const response = await fetch(
        'https://pvtrmpaxhbvhvdiojqkd.supabase.co/functions/v1/check-model-status',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': apiKey
          },
          body: JSON.stringify({ jobId }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed with status ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage}: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Check model status response from direct fetch:', data);
      return data;
    }
  } catch (error) {
    console.error('Error checking model status:', error);
    
    // Fallback: Try to get basic job data directly from the database
    try {
      console.log('Falling back to database check for job status');
      
      const { data, error: queryError } = await supabase
        .from('jobs')
        .select('status, model_url, image_url, image_variations')
        .eq('id', jobId)
        .single();
        
      if (queryError) {
        console.error('Database error:', queryError);
        return {
          success: false,
          status: 'error',
          error: 'Failed to retrieve job status: ' + queryError.message,
          meshyTaskId: null
        };
      }
      
      if (!data) {
        return {
          success: false,
          status: 'error',
          error: 'Job not found',
          meshyTaskId: null
        };
      }
      
      // Return a standard response format with all available data
      return {
        success: true,
        status: data.status,
        modelUrl: data.model_url,
        imageUrl: data.image_url,
        imageVariations: data.image_variations,
        meshyTaskId: null
      };
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      return {
        success: false,
        status: 'error',
        error: 'Failed to retrieve job status',
        meshyTaskId: null
      };
    }
  }
};
