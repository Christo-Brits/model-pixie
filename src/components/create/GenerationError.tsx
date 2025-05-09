
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface GenerationErrorProps {
  error: string | null;
  details?: string | null;
  onRetry?: () => void;
}

export const GenerationError: React.FC<GenerationErrorProps> = ({ 
  error, 
  details,
  onRetry 
}) => {
  if (!error) return null;
  
  return (
    <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 rounded-lg flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="w-full">
        <p className="font-medium text-destructive">Generation Error</p>
        <p className="text-sm text-destructive/80">{error}</p>
        
        {details && (
          <details className="mt-2">
            <summary className="text-xs text-destructive/70 cursor-pointer hover:text-destructive/90">
              Technical details
            </summary>
            <pre className="mt-2 p-2 bg-background/50 rounded text-xs overflow-x-auto text-destructive/70 whitespace-pre-wrap">
              {details}
            </pre>
          </details>
        )}
        
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-3 text-sm px-3 py-1 bg-background rounded border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
