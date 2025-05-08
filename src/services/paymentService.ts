
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Type for payment package options
export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
};

// Available credit packages
export const creditPackages: CreditPackage[] = [
  {
    id: "package1",
    name: "Single Credit",
    credits: 1,
    price: 5,
  },
  {
    id: "package2",
    name: "Five Credits",
    credits: 5,
    price: 20,
    popular: true,
  },
  {
    id: "package3",
    name: "Fifteen Credits",
    credits: 15,
    price: 50,
    bestValue: true,
  },
];

// Function to create a checkout session and redirect to Stripe
export const createCheckoutSession = async (packageId: string): Promise<void> => {
  try {
    // Call our create-checkout edge function
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { packageId },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process', {
        description: error.message || 'Please try again later',
      });
      return;
    }

    // Redirect to Stripe Checkout
    if (data?.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      toast.error('Invalid response from checkout service');
    }
  } catch (err) {
    console.error('Unexpected error during checkout:', err);
    toast.error('Checkout process failed', {
      description: 'An unexpected error occurred. Please try again later.',
    });
  }
};

// Function to fetch payment history for a user
export const fetchPaymentHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

// Function to handle the checkout success or cancellation
export const handleCheckoutResult = (searchParams: URLSearchParams) => {
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  
  if (success === 'true') {
    toast.success('Payment successful!', {
      description: 'Your credits have been added to your account.',
    });
    return true;
  }
  
  if (canceled === 'true') {
    toast.error('Payment canceled', {
      description: 'Your payment was canceled. No credits were added.',
    });
  }
  
  return false;
};
