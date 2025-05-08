
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types/job';
import { checkUserCredits, deductUserCredits } from './creditService';

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
export const createJob = async (userId: string | undefined | null, prompt: string) => {
  try {
    // Check if user is authenticated
    if (!userId) {
      throw new Error("Authentication required. Please sign in to continue.");
    }
    
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
