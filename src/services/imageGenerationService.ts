
import { supabase } from '@/integrations/supabase/client';

/**
 * Function to generate images from a prompt
 * @param jobId The ID of the job
 * @param prompt The prompt for generating images
 * @param sketch Optional base64-encoded sketch
 */
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
