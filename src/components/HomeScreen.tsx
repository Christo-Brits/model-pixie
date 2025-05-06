
import React from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { ModelCarousel } from '@/components/ModelCarousel';
import { CommunityHighlights } from '@/components/CommunityHighlights';
import { QuickTip } from '@/components/QuickTip';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CreateModelButton } from '@/components/CreateModelButton';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export const HomeScreen = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex-1 px-4 pt-4 pb-20 overflow-y-auto space-y-8">
        {!user && (
          <section className="flex justify-center py-4">
            <Link to="/auth">
              <Button variant="outline" className="w-full">
                Sign In / Sign Up
              </Button>
            </Link>
          </section>
        )}
        
        {user && (
          <section className="flex justify-between items-center py-2">
            <p className="text-sm">Signed in as: {user.email}</p>
            <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
          </section>
        )}
        
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
