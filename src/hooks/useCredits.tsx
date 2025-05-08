
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';

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
      const { data: currentData, error: fetchError } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) {
        throw new Error(`Failed to verify current credit balance: ${fetchError.message}`);
      }
      
      const currentCredits = currentData?.credits || 0;
      
      if (currentCredits < amount) {
        toast.error('Insufficient credits', {
          description: 'Your credit balance has changed. Please purchase more credits to continue.',
        });
        await fetchCredits(); // Refresh the displayed credit count
        return false;
      }
      
      // Update the credits in the database
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ 
          credits: currentCredits - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        throw new Error(`Failed to update credits: ${updateError.message}`);
      }
      
      // Update local state
      setCredits(currentCredits - amount);
      
      toast.success(`${amount} credit${amount !== 1 ? 's' : ''} used`, {
        description: `Your new balance is ${currentCredits - amount} credit${currentCredits - amount !== 1 ? 's' : ''}`,
      });
      
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
