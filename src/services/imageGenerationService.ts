
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
        // First, enhance the prompt
        console.log("Attempting to enhance prompt before image generation");
        let enhancedPrompt = prompt;
        
        try {
          const enhanceResponse = await fetch(
            'https://pvtrmpaxhbvhvdiojqkd.supabase.co/functions/v1/enhance-prompt',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabase.auth.session()?.access_token || ''}`,
                'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w"
              },
              body: JSON.stringify({ prompt })
            }
          );
          
          if (enhanceResponse.ok) {
            const enhanceData = await enhanceResponse.json();
            if (enhanceData.enhancedPrompt) {
              enhancedPrompt = enhanceData.enhancedPrompt;
              console.log(`Prompt enhanced: ${enhancedPrompt}`);
            }
          }
        } catch (enhanceError) {
          console.error('Error enhancing prompt, will use original:', enhanceError);
        }
        
        // Try to use the direct fetch approach for image generation
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
              prompt: enhancedPrompt, // Use the enhanced prompt
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

/**
 * Function to enhance a prompt using the enhance-prompt edge function
 * @param prompt The prompt to enhance
 * @returns The enhanced prompt
 */
export const enhancePrompt = async (prompt: string): Promise<string> => {
  try {
    console.log(`Enhancing prompt: ${prompt}`);
    
    // Get the current session asynchronously
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    // Use the public anon key 
    const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w";
    
    const response = await fetch(
      'https://pvtrmpaxhbvhvdiojqkd.supabase.co/functions/v1/enhance-prompt',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': apiKey
        },
        body: JSON.stringify({ prompt })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to enhance prompt: ${errorText}`);
      return prompt; // Return original prompt if enhancement fails
    }
    
    const data = await response.json();
    
    if (data.enhancedPrompt) {
      console.log(`Enhanced prompt: ${data.enhancedPrompt}`);
      return data.enhancedPrompt;
    }
    
    return prompt; // Return original prompt if no enhanced version is returned
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return prompt; // Return original prompt if enhancement fails
  }
};
