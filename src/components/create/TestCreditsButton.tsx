
import React from 'react';
import { Gift, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';

interface TestCreditsButtonProps {
  isAddingCredits: boolean;
  user: User | null;
  onAddTestCredits: () => void;
}

export const TestCreditsButton: React.FC<TestCreditsButtonProps> = ({ 
  isAddingCredits, 
  user, 
  onAddTestCredits 
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-dashed border-muted">
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={onAddTestCredits}
        disabled={isAddingCredits || !user}
      >
        {isAddingCredits ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding test credits...
          </>
        ) : !user ? (
          <>
            <LogIn className="h-4 w-4" />
            Sign in to add credits
          </>
        ) : (
          <>
            <Gift className="h-4 w-4" />
            Add 10 test credits
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground mt-2">
        For testing purposes only
      </p>
    </div>
  );
};
