
import { supabase } from '@/integrations/supabase/client';

// Type for Job data
export type Job = {
  id?: string;
  job_id?: string;
  user_id: string;
  prompt: string;
  status?: string;
  image_url?: string;
  model_url?: string;
  iterations?: number;
  created_at?: string;
}

// Function to fetch a user's jobs
export const fetchUserJobs = async (userId: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

// Function to check if the user has enough credits
export const checkUserCredits = async (userId: string, requiredCredits: number = 1): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.warn('Error checking user credits:', error);
      return false;
    }
    
    return data.credits >= requiredCredits;
  } catch (err) {
    console.error('Error in checkUserCredits:', err);
    return false;
  }
};

// Function to deduct credits from user account
export const deductUserCredits = async (userId: string, credits: number = 1): Promise<boolean> => {
  try {
    // First check if user has enough credits
    const hasEnoughCredits = await checkUserCredits(userId, credits);
    if (!hasEnoughCredits) {
      return false;
    }
    
    // Get current credit balance
    const { data: currentData, error: selectError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();
      
    if (selectError) throw selectError;
    
    // Deduct credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ 
        credits: currentData.credits - credits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    if (updateError) throw updateError;
    return true;
  } catch (err) {
    console.error('Error deducting user credits:', err);
    return false;
  }
};

// Function to create a new job
export const createJob = async (userId: string, prompt: string) => {
  try {
    // First check if user has enough credits
    const hasEnoughCredits = await checkUserCredits(userId);
    if (!hasEnoughCredits) {
      throw new Error("Insufficient credits. Please purchase more credits to continue.");
    }
    
    // Deduct 1 credit for creating a job
    const creditDeducted = await deductUserCredits(userId);
    if (!creditDeducted) {
      throw new Error("Failed to process credit transaction. Please try again.");
    }
    
    // First try to use the Edge Function for job creation
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
      'create-job',
      {
        body: { prompt, userId },
      }
    );

    if (!edgeFunctionError && edgeFunctionData?.job) {
      return edgeFunctionData.job;
    }

    console.warn('Edge function failed or not available, falling back to direct database insert:', edgeFunctionError);
    
    // Fallback: Direct database insert
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        prompt: prompt,
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

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
    // Try to use the Edge Function for model generation
    const { data, error } = await supabase.functions.invoke(
      'generate-model',
      {
        body: { jobId, imageUrl },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to generate model');
    }

    return data;
  } catch (error) {
    console.error('Error generating model:', error);
    throw error;
  }
};

// Function to generate images from a prompt
export const generateImages = async (jobId: string, prompt: string, sketch?: string) => {
  try {
    // Try to use the Edge Function for image generation
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

    return data;
  } catch (error) {
    console.error('Error generating images:', error);
    throw error;
  }
};

// Function to fetch a specific job
export const fetchJob = async (jobId: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();
    
  if (error) throw error;
  return data;
};

// Function to check job status
export const checkJobStatus = async (jobId: string) => {
  try {
    // Try to use the Edge Function for job status
    const { data, error } = await supabase.functions.invoke(
      'job-status',
      {
        body: { jobId },
        method: 'GET'
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to check job status');
    }

    return data;
  } catch (error) {
    console.error('Error checking job status:', error);
    
    // Fallback: Direct database query
    console.log('Falling back to direct database query for job status');
    const { data, error: dbError } = await supabase
      .from('jobs')
      .select('status, image_url, model_url, iterations')
      .eq('id', jobId)
      .single();
      
    if (dbError) throw dbError;
    
    return {
      status: data?.status || 'unknown',
      imageUrl: data?.image_url,
      modelUrl: data?.model_url,
      iterations: data?.iterations || 0
    };
  }
};

// Function to update job status
export const updateJobStatus = async (jobId: string, status: string) => {
  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId);
    
  if (error) throw error;
  return true;
};

// Function to save feedback for a job
export const saveFeedback = async (jobId: string, rating: number, comment?: string) => {
  try {
    // Try to use the Edge Function for feedback submission
    const { data, error } = await supabase.functions.invoke(
      'feedback',
      {
        body: { jobId, rating, comment },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to submit feedback');
    }

    return data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // Fallback: Direct database insert
    const { error: dbError } = await supabase
      .from('feedback')
      .insert({
        job_id: jobId,
        rating,
        comment
      });
      
    if (dbError) throw dbError;
    return true;
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
