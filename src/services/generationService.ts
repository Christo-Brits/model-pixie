import { supabase } from '@/integrations/supabase/client';

// Function to refine an image/model
export const refineModel = async (jobId: string, editInstructions: string) => {
  try {
    // Try to use the Edge Function for refinement
    const { data, error } = await supabase.functions.invoke(
      'refine-image',
      {
        body: { jobId, editInstructions },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to refine image');
    }

    return data;
  } catch (error) {
    console.error('Error refining image:', error);
    throw error;
  }
};

// Function to generate a model from an image
export const generateModel = async (jobId: string, imageUrl: string) => {
  try {
    console.log(`Generating 3D model for job ${jobId} with image: ${imageUrl}`);
    
    // Add retry logic for network issues
    let retries = 3;
    let lastError = null;
    let backoffTime = 1000; // Start with 1 second
    
    while (retries > 0) {
      try {
        console.log(`Attempt ${4 - retries}/3 to generate 3D model`);
        
        // Get the current session asynchronously (proper way)
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token || '';
        
        // Use the public anon key from the URL rather than accessing protected property
        const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w";
        
        // Try direct fetch first
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
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || errorJson.details || `Failed with status ${response.status}`);
          } catch (e) {
            throw new Error(`Failed with status ${response.status}: ${errorText}`);
          }
        }

        const data = await response.json();
        console.log('Model generation response:', data);
        
        // Check for specific error about API key
        if (data.error && data.error.includes('MESHY_API_KEY')) {
          throw new Error('Meshy API key is not configured in the server. Please contact support.');
        }
        
        return data;
      } catch (error: any) {
        console.error(`Error on try ${4 - retries}/3:`, error);
        lastError = error;
        retries -= 1;
        
        // Check if the error is related to the Meshy API key not being configured
        if (error.message && (error.message.includes('MESHY_API_KEY') || error.message.includes('Meshy API'))) {
          // Don't retry if it's an API key configuration issue
          console.error('Meshy API error. Stopping retries.');
          throw error;
        }
        
        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          console.log(`Retrying in ${backoffTime/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          backoffTime *= 2; // Double the backoff time for next retry
        }
      }
    }
    
    // If we've exhausted all retries, throw the last error
    throw lastError;
  } catch (error) {
    console.error('Error generating model:', error);
    throw error;
  }
};

// Function to check the status of a model generation job
export const checkModelGenerationStatus = async (jobId: string) => {
  try {
    // Add retry logic
    let retries = 3;
    let lastError = null;
    let backoffTime = 1000;
    
    while (retries > 0) {
      try {
        // Get the current session asynchronously (proper way)
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token || '';
        
        // Use the public anon key from the URL rather than accessing protected property
        const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w";
        
        // Try direct fetch first
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
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Failed with status ${response.status}`);
          } catch (e) {
            throw new Error(`Failed with status ${response.status}: ${errorText}`);
          }
        }

        const data = await response.json();
        console.log('Check model status response:', data);
        return data;
      } catch (error) {
        console.error(`Error on try ${4 - retries}/3:`, error);
        lastError = error;
        retries -= 1;
        
        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          backoffTime *= 2; // Double the backoff time for next retry
        }
      }
    }
    
    // Fallback: If direct API call fails after all retries, try using supabase.functions.invoke
    try {
      console.log("Falling back to supabase.functions.invoke for check-model-status");
      const { data, error } = await supabase.functions.invoke(
        'check-model-status',
        {
          body: { jobId },
        }
      );

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      return data;
    } catch (fallbackError) {
      // If both approaches fail, fallback to checking the job status directly in the database
      console.error('Falling back to database check after edge function failure:', fallbackError);
      
      // Fix: Properly handle the error case when metadata column doesn't exist
      try {
        // First, check if we have basic job data
        const { data, error } = await supabase
          .from('jobs')
          .select('status, model_url')
          .eq('id', jobId)
          .single();
          
        if (error) {
          console.error('Database error:', error);
          // Return a standard response format even when querying fails
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
        
        // Try to get metadata in a separate query if needed
        let meshyTaskId = null;
        try {
          // Fixed: First check if the metadata column exists before attempting to query it
          // Use a properly typed approach to call the RPC function
          const { data: columnCheckData, error: columnCheckError } = await supabase.rpc<boolean>('check_column_exists', {
            table_name: 'jobs',
            column_name: 'metadata'
          });
          
          const hasMetadataColumn = !columnCheckError && columnCheckData === true;
          
          if (hasMetadataColumn) {
            // Only query metadata if the column exists
            const { data: metadataResult, error: metadataError } = await supabase
              .from('jobs')
              .select('metadata')
              .eq('id', jobId)
              .maybeSingle();
              
            // Fix: Use optional chaining and type guards to safely access metadata
            if (!metadataError && metadataResult && metadataResult.metadata) {
              // Safe access pattern using optional chaining and type assertion if needed
              const metadata = metadataResult.metadata as Record<string, any>;
              meshyTaskId = metadata?.meshy_task_id || null;
            }
          } else {
            console.log('Metadata column does not exist in jobs table');
          }
        } catch (metadataError) {
          console.log('Error accessing metadata, continuing without it:', metadataError);
        }
        
        // Return a standard response format even when querying directly
        return {
          success: true,
          status: data.status,
          modelUrl: data.model_url,
          // Include meshyTaskId if available
          meshyTaskId: meshyTaskId
        };
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Return a fallback response that matches the expected format
        return {
          success: false,
          status: 'error',
          error: 'Failed to retrieve job status',
          meshyTaskId: null
        };
      }
    }
  } catch (error) {
    console.error('Error checking model status:', error);
    throw error;
  }
};

// Function to generate images from a prompt
export const generateImages = async (jobId: string, prompt: string, sketch?: string) => {
  try {
    console.log(`Generating images for job ${jobId} with prompt: ${prompt}`);
    
    // Add retry logic for network issues
    let retries = 3;
    let lastError = null;
    let backoffTime = 1000; // Start with 1 second
    
    while (retries > 0) {
      try {
        // Try to use the direct fetch approach first
        console.log("Attempt direct API call to generate-images edge function");
        
        // Get the current session asynchronously (proper way)
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token || '';
        
        // Use the public anon key from the URL rather than accessing protected property
        const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w";
        
        const response = await fetch(
          'https://pvtrmpaxhbvhvdiojqkd.supabase.co/functions/v1/generate-images',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey': apiKey
            },
            body: JSON.stringify({ 
              jobId, 
              prompt,
              sketch // Optional base64-encoded sketch
            })
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to generate images: ${errorText}`);
        }
        
        const data = await response.json();
        
        // Check for error in the response data
        if (data.error) {
          throw new Error(data.error);
        }
        
        return data;
        
      } catch (directFetchError) {
        console.error(`Direct fetch approach failed:`, directFetchError);
        
        try {
          // Fall back to supabase.functions.invoke if direct fetch fails
          console.log("Falling back to supabase.functions.invoke");
          const { data, error } = await supabase.functions.invoke(
            'generate-images',
            {
              body: { 
                jobId, 
                prompt,
                sketch // Optional base64-encoded sketch
              },
            }
          );

          if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Failed to generate images');
          }
          
          // Check for error in the response data
          if (data && data.error) {
            throw new Error(data.error);
          }

          return data;
        } catch (error) {
          console.error(`Error on try ${4 - retries}/3:`, error);
          lastError = error;
          retries -= 1;
          if (retries > 0) {
            // Wait before retrying (exponential backoff)
            console.log(`Retrying in ${backoffTime/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            backoffTime *= 2; // Double the backoff time for next retry
          }
        }
      }
    }
    
    // If we've exhausted all retries, throw the last error
    throw lastError || new Error('Failed to generate images after multiple attempts');
  } catch (error) {
    console.error('Error generating images:', error);
    throw error;
  }
};

// Function to add test credits to the user's account
export const addTestCredits = async (userId: string, credits: number = 10) => {
  try {
    // Call the Supabase edge function to add test credits
    const { data, error } = await supabase.functions.invoke(
      'add-test-credits',
      {
        body: { userId, credits },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to add test credits');
    }

    return data;
  } catch (error) {
    console.error('Error adding test credits:', error);
    throw error;
  }
};
