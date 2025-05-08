
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch credits on initial load and when user changes
  useEffect(() => {
    fetchCredits();
  }, [user?.id]);

  return {
    credits,
    loading,
    error,
    refetchCredits: fetchCredits,
  };
}
