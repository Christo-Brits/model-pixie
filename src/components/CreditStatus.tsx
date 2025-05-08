
import React from 'react';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCredits } from '@/hooks/useCredits';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from '@/hooks/useAuth';

export function CreditStatus() {
  const { credits, loading } = useCredits();
  const { user } = useAuth();
  
  // Don't show if user is not logged in
  if (!user) {
    return null;
  }
  
  return (
    <Link to="/credits">
      <Button variant="outline" size="sm" className="h-8 gap-1">
        <Coins className="h-4 w-4" />
        {loading ? (
          <Skeleton className="h-4 w-8" />
        ) : (
          <span>{credits} credit{credits !== 1 ? 's' : ''}</span>
        )}
      </Button>
    </Link>
  );
}
