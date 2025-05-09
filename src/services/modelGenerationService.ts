
import { toast } from '@/hooks/use-toast';
import { invokeFunctionWithFallback, updateJobStatusToError } from './utils/supabaseFunctionHelper';

/**
 * Function to generate a 3D model from an image
 * @param jobId The ID of the job
 * @param imageUrl The URL of the image to generate the model from
 */
export const generateModel = async (jobId: string, imageUrl: string) => {
  try {
    console.log(`Generating 3D model for job ${jobId} with image: ${imageUrl}`);
    
    try {
      const data = await invokeFunctionWithFallback('generate-model', { jobId, imageUrl });
      
      // Check for specific error about API key
      if (data.error && data.error.includes('MESHY_API_KEY')) {
        throw new Error('Meshy API key is not configured in the server. Please contact support.');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error generating model:', error);
      
      // Update job status to error
      await updateJobStatusToError(jobId, error.message);
      
      throw error;
    }
  } catch (error: any) {
    console.error('Error in generateModel:', error);
    throw error;
  }
};

/**
 * Function to check the status of a model generation job
 * @param jobId The ID of the job to check
 */
export const checkModelGenerationStatus = async (jobId: string): Promise<any> => {
  try {
    try {
      const data = await invokeFunctionWithFallback('check-model-status', { jobId });
      return data;
    } catch (error) {
      console.error('Error checking model status:', error);
      
      // Re-export existing fallback logic from the original service
      return await checkDatabaseForJobStatus(jobId);
    }
  } catch (error) {
    console.error('Error in checkModelGenerationStatus:', error);
    throw error;
  }
};

// Import needed functions from the original service
import { supabase } from '@/integrations/supabase/client';

/**
 * Fallback function to check job status directly from the database
 * @param jobId The ID of the job to check
 */
const checkDatabaseForJobStatus = async (jobId: string): Promise<any> => {
  console.log('Falling back to database check for job status');
  
  try {
    const { data, error: queryError } = await supabase
      .from('jobs')
      .select('status, model_url, image_url, image_variations')
      .eq('id', jobId)
      .single();
      
    if (queryError) {
      console.error('Database error:', queryError);
      return {
        success: false,
        status: 'error',
        error: 'Failed to retrieve job status: ' + queryError.message,
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
    
    // Return a standard response format with all available data
    return {
      success: true,
      status: data.status,
      modelUrl: data.model_url,
      imageUrl: data.image_url,
      imageVariations: data.image_variations,
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
};
