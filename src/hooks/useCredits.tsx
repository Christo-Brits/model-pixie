
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';

/**
 * Custom hook for managing user credits - refactored for better maintainability
 */
export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConsuming, setIsConsuming] = useState<boolean>(false);

  // Fetch user credits
  const fetchCredits = async () => {
    if (!user) {
      setCredits(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        setError('Failed to load credit balance');
        setCredits(0);
      } else {
        setCredits(data?.credits || 0);
      }
    } catch (err) {
      console.error('Error in fetchCredits:', err);
      setError('An unexpected error occurred');
      setCredits(0);
    } finally {
      setLoading(false);
    }
  };

  // Consume credits function
  const consumeCredits = async (amount: number = 1): Promise<boolean> => {
    if (!user) {
      toast.error('You must be signed in to use credits');
      return false;
    }

    if (credits < amount) {
      toast.error('Insufficient credits', {
        description: 'Please purchase more credits to continue',
      });
      return false;
    }

    setIsConsuming(true);
    
    try {
      // First, get the latest credit count to ensure we have the most up-to-date value
      const currentCredits = await getCurrentCreditBalance(user.id);
      
      if (currentCredits < amount) {
        handleInsufficientCredits();
        await fetchCredits(); // Refresh the displayed credit count
        return false;
      }
      
      // Update the credits in the database
      const success = await updateCreditsInDatabase(user.id, currentCredits, amount);
      
      if (!success) {
        return false;
      }
      
      // Update local state
      setCredits(currentCredits - amount);
      
      // Show success toast
      displaySuccessMessage(amount, currentCredits - amount);
      
      return true;
    } catch (err) {
      console.error('Error consuming credits:', err);
      toast.error('Failed to process credits', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      return false;
    } finally {
      setIsConsuming(false);
    }
  };

  // Helper function to get current credit balance
  const getCurrentCreditBalance = async (userId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw new Error(`Failed to verify current credit balance: ${error.message}`);
    }
    
    return data?.credits || 0;
  };

  // Helper function to handle insufficient credits
  const handleInsufficientCredits = () => {
    toast.error('Insufficient credits', {
      description: 'Your credit balance has changed. Please purchase more credits to continue.',
    });
  };

  // Helper function to update credits in the database
  const updateCreditsInDatabase = async (userId: string, currentCredits: number, amount: number): Promise<boolean> => {
    const { error } = await supabase
      .from('user_credits')
      .update({ 
        credits: currentCredits - amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) {
      toast.error('Failed to update credits', {
        description: error.message || 'An unexpected error occurred',
      });
      return false;
    }
    
    return true;
  };

  // Helper function to display success message
  const displaySuccessMessage = (amount: number, newBalance: number) => {
    toast.success(`${amount} credit${amount !== 1 ? 's' : ''} used`, {
      description: `Your new balance is ${newBalance} credit${newBalance !== 1 ? 's' : ''}`,
    });
  };

  // Fetch credits on initial load and when user changes
  useEffect(() => {
    fetchCredits();
  }, [user?.id]);

  return {
    credits,
    loading,
    error,
    isConsuming,
    refetchCredits: fetchCredits,
    consumeCredits,
  };
}
