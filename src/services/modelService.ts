
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

// Function to create a new job
export const createJob = async (userId: string, prompt: string) => {
  try {
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
  const { error } = await supabase
    .from('feedback')
    .insert({
      job_id: jobId,
      rating,
      comment
    });
    
  if (error) throw error;
  return true;
};
