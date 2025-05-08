
import { supabase } from '@/integrations/supabase/client';

// Function to use a credit to reset refinement iterations
export const useRefinementCredit = async (jobId: string, userId: string): Promise<{
  success: boolean;
  message: string;
  creditsRemaining?: number;
}> => {
  try {
    // Call the Edge Function for using a refinement credit
    const { data, error } = await supabase.functions.invoke(
      'use-refinement-credit',
      {
        body: { 
          jobId,
          userId 
        },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to use refinement credit');
    }

    return data;
  } catch (error) {
    console.error('Error using refinement credit:', error);
    throw error;
  }
};
