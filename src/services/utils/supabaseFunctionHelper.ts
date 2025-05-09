
import { supabase } from '@/integrations/supabase/client';

// Common anon key used across service calls
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w";

/**
 * Helper to get the current session's access token
 */
export const getAccessToken = async (): Promise<string> => {
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData?.session?.access_token || '';
};

/**
 * Invokes a Supabase function with fallback to direct fetch if needed
 * @param functionName The name of the function to call
 * @param body The request body
 * @returns Response data from the function
 */
export const invokeFunctionWithFallback = async (
  functionName: string, 
  body: Record<string, any>
): Promise<any> => {
  const accessToken = await getAccessToken();
  
  try {
    console.log(`First trying supabase.functions.invoke for ${functionName}`);
    
    // First try using supabase.functions.invoke
    const { data, error } = await supabase.functions.invoke(
      functionName,
      {
        body,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }
    );

    if (error) {
      console.error(`Error using supabase.functions.invoke for ${functionName}:`, error);
      throw error;
    }

    console.log(`${functionName} response from functions.invoke:`, data);
    return data;
  } catch (invokeError) {
    console.error(`Failed with functions.invoke for ${functionName}, trying direct fetch:`, invokeError);
    
    // If that fails, fall back to direct API call
    const response = await fetch(
      `https://pvtrmpaxhbvhvdiojqkd.supabase.co/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(body),
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
    console.log(`${functionName} response from direct fetch:`, data);
    return data;
  }
};

/**
 * Update job status in database to error
 * @param jobId The ID of the job
 * @param errorMessage The error message
 */
export const updateJobStatusToError = async (jobId: string, errorMessage: string): Promise<void> => {
  try {
    await supabase
      .from('jobs')
      .update({ status: 'error', error_message: errorMessage })
      .eq('id', jobId);
  } catch (updateError) {
    console.error('Failed to update job status to error:', updateError);
  }
};
