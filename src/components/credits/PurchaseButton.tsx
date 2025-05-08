
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface PurchaseButtonProps {
  isProcessing: boolean;
  user: User | null;
  onPurchase: () => Promise<void>;
}

export function PurchaseButton({ isProcessing, user, onPurchase }: PurchaseButtonProps) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute left-0 w-20 h-20 -z-10 bg-primary/10 rounded-full blur-xl opacity-70"></div>
      <div aria-hidden="true" className="absolute right-0 w-16 h-16 -z-10 bg-accent/10 rounded-full blur-lg opacity-70"></div>
      
      <Button 
        onClick={onPurchase} 
        className="w-full py-6" 
        size="lg"
        disabled={isProcessing || !user}
      >
        {isProcessing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : !user ? (
          "Sign In to Purchase"
        ) : (
          "Complete Purchase"
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground mt-4">
        Secure payment processing. Your credits will be available instantly.
      </p>
    </div>
  );
}
