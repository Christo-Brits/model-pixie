
import { supabase } from '@/integrations/supabase/client';

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
