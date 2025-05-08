
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CreditBalanceDisplayProps {
  credits: number;
  creditsLoading: boolean;
  onRefresh: () => void;
}

export function CreditBalanceDisplay({ 
  credits, 
  creditsLoading, 
  onRefresh 
}: CreditBalanceDisplayProps) {
  if (creditsLoading) return null;
  
  return (
    <div className="mt-2 flex justify-center items-center gap-2">
      <span className="text-sm font-medium">Current balance: {credits} credits</span>
      <Button variant="ghost" size="sm" onClick={onRefresh} className="h-6 w-6 p-0">
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  );
}
