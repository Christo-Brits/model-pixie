
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface GenerationErrorProps {
  error: string | null;
}

export const GenerationError: React.FC<GenerationErrorProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 rounded-lg flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-destructive">Generation Error</p>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    </div>
  );
};
