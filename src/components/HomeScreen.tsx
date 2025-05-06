
import React from 'react';
import { TopBar } from '@/components/TopBar';
import { ModelCarousel } from '@/components/ModelCarousel';
import { CommunityHighlights } from '@/components/CommunityHighlights';
import { QuickTip } from '@/components/QuickTip';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CreateModelButton } from '@/components/CreateModelButton';

export const HomeScreen = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex-1 px-4 pt-4 pb-20 overflow-y-auto space-y-8">
        <section className="flex justify-center py-6">
          <CreateModelButton />
        </section>
        
        <section className="space-y-3">
          <h2 className="font-semibold text-xl">Your Recent Models</h2>
          <ModelCarousel />
        </section>
        
        <section className="space-y-3">
          <h2 className="font-semibold text-xl">Community Highlights</h2>
          <CommunityHighlights />
        </section>
        
        <section className="py-2">
          <QuickTip />
        </section>
      </div>
      <BottomNavigation />
    </div>
  );
};
