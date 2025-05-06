
import React from 'react';
import { Logo } from '@/components/Logo';
import { Star } from 'lucide-react';

export const TopBar = () => {
  return (
    <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm border-b">
      <Logo size="sm" />
      <div className="flex items-center gap-1.5 bg-primary/10 text-primary font-medium rounded-full px-3 py-1">
        <Star className="h-4 w-4 fill-primary text-primary" />
        <span>5</span>
      </div>
    </div>
  );
};
