
import { supabase } from '@/integrations/supabase/client';

/**
 * Function to add test credits to the user's account
 * @param userId The ID of the user
 * @param credits The number of credits to add (default: 10)
 */
export const addTestCredits = async (userId: string, credits: number = 10) => {
  try {
    // Call the Supabase edge function to add test credits
    const { data, error } = await supabase.functions.invoke(
      'add-test-credits',
      {
        body: { userId, credits },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to add test credits');
    }

    return data;
  } catch (error) {
    console.error('Error adding test credits:', error);
    throw error;
  }
};
