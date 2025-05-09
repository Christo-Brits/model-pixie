
import { supabase } from '@/integrations/supabase/client';
import { apiRequest } from './utils/apiUtils';

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
    
    // Make the API request to generate the 3D model
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
    console.log('Model generation response:', data);
    
    // Check for specific error about API key
    if (data.error && data.error.includes('MESHY_API_KEY')) {
      throw new Error('Meshy API key is not configured in the server. Please contact support.');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating model:', error);
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
    
    // Make the API request to check the model generation status
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
    console.log('Check model status response:', data);
    return data;
  } catch (error) {
    console.error('Error checking model status:', error);
    
    // Fallback: Try to get basic job data directly from the database
    try {
      console.log('Falling back to database check for job status');
      
      const { data, error } = await supabase
        .from('jobs')
        .select('status, model_url')
        .eq('id', jobId)
        .single();
        
      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          status: 'error',
          error: 'Failed to retrieve job status: ' + error.message,
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
      
      // Return a standard response format
      return {
        success: true,
        status: data.status,
        modelUrl: data.model_url,
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
