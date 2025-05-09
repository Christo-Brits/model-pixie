
import { supabase } from '@/integrations/supabase/client';

// Common API key for Supabase function calls
export const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w";

/**
 * Make an API request to a Supabase Edge Function
 * @param functionName The name of the Edge Function
 * @param body The body of the request
 */
export const apiRequest = async (functionName: string, body: Record<string, any>) => {
  try {
    // Get the current session asynchronously
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    const response = await fetch(
      `https://pvtrmpaxhbvhvdiojqkd.supabase.co/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_API_KEY
        },
        body: JSON.stringify(body),
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
    
    return await response.json();
  } catch (error) {
    console.error(`Error in API request to ${functionName}:`, error);
    throw error;
  }
};

/**
 * Sleep for a specified amount of time
 * @param ms The number of milliseconds to sleep
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exponential backoff retry function
 * @param fn The function to retry
 * @param retries The number of retries
 * @param initialBackoff The initial backoff time in milliseconds
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>, 
  retries: number = 3, 
  initialBackoff: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  let backoffTime = initialBackoff;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      console.error(`Error on attempt ${i + 1}/${retries}:`, error);
      lastError = error;
      
      if (i < retries - 1) {
        console.log(`Retrying in ${backoffTime/1000} seconds...`);
        await sleep(backoffTime);
        backoffTime *= 2; // Double the backoff time for next retry
      }
    }
  }
  
  throw lastError || new Error('Operation failed after multiple attempts');
};
