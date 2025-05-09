import { supabase } from '@/integrations/supabase/client';

// Function to check job status
export const checkJobStatus = async (jobId: string) => {
  try {
    console.log(`Checking job status for job: ${jobId}`);
    
    try {
      // Try to use the Edge Function for job status
      const { data, error } = await supabase.functions.invoke(
        'job-status',
        {
          method: 'GET',
          body: { jobId },
        }
      );

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to check job status');
      }
      
      console.log('Edge function job status response:', data);
      return data;
    } catch (error) {
      console.error('Error checking job status:', error);
      
      // Fallback: Direct database query
      console.log('Falling back to direct database query for job status');
      const { data, error: dbError } = await supabase
        .from('jobs')
        .select('status, image_url, model_url, iterations, image_variations')
        .eq('id', jobId)
        .maybeSingle();
        
      if (dbError) {
        console.error('Database query error:', dbError);
        throw dbError;
      }
      
      if (!data) {
        console.warn(`No data found for job ${jobId}`);
        return {
          status: 'unknown',
          imageUrl: null,
          modelUrl: null,
          iterations: 0,
          imageVariations: []
        };
      }
      
      return {
        status: data?.status || 'unknown',
        imageUrl: data?.image_url,
        modelUrl: data?.model_url,
        iterations: data?.iterations || 0,
        imageVariations: data?.image_variations
      };
    }
  } catch (finalError) {
    console.error('Final error in checkJobStatus:', finalError);
    throw finalError;
  }
};

// Function to update job status
export const updateJobStatus = async (jobId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', jobId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update job status:', error);
    throw error;
  }
};

// Function to get human-readable status description
export const getStatusDescription = (status: string) => {
  switch (status) {
    case 'queued':
      return 'Waiting in queue';
    case 'processing':
      return 'Processing your request';
    case 'rendering':
      return 'Rendering the model';
    case 'refining':
      return 'Refining the image';
    case 'images_ready':
      return 'Choose an image to create a 3D model';
    case 'completed':
      return 'Processing complete';
    case 'error':
      return 'An error occurred';
    case 'failed':
      return 'Processing failed';
    case 'cancelled':
      return 'Processing cancelled';
    default:
      return 'Status unknown';
  }
};

/**
 * Creates a polling mechanism to check job status at regular intervals
 * Returns a function to cancel the polling
 */
export const pollJobStatus = (jobId: string, callback: (status: any) => void, interval = 5000) => {
  let isPolling = true;
  
  const poll = async () => {
    if (!isPolling) return;
    
    try {
      const status = await checkJobStatus(jobId);
      callback(status);
      
      // If job is in a terminal state, stop polling
      if (['completed', 'error', 'failed', 'cancelled'].includes(status.status)) {
        isPolling = false;
      } else {
        // Continue polling
        setTimeout(poll, interval);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      // Continue polling even on error, but with a slightly longer interval
      if (isPolling) {
        setTimeout(poll, interval * 2);
      }
    }
  };
  
  // Start polling
  poll();
  
  // Return function to cancel polling
  return () => {
    isPolling = false;
  };
};
