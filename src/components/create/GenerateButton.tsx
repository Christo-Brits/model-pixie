
import React from 'react';
import { Sparkles, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';

interface GenerateButtonProps {
  isGenerating: boolean;
  user: User | null;
  onGenerate: () => void;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ isGenerating, user, onGenerate }) => {
  return (
    <Button 
      className="gap-2 pixie-gradient text-white shadow-lg py-6"
      onClick={onGenerate}
      disabled={isGenerating || !user}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating...
        </>
      ) : !user ? (
        <>
          <LogIn className="h-5 w-5" />
          Sign in to Generate
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5" />
          Generate
        </>
      )}
    </Button>
  );
};
