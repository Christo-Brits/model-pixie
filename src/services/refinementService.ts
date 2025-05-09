
import { supabase } from '@/integrations/supabase/client';

/**
 * Function to refine an image/model
 * @param jobId The ID of the job
 * @param editInstructions The instructions for refining the image/model
 */
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
