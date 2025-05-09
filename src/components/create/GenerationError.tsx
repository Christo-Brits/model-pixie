
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GenerationErrorProps {
  error: string | null;
  details?: string | null;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export const GenerationError: React.FC<GenerationErrorProps> = ({ 
  error, 
  details,
  onRetry,
  onGoBack
}) => {
  if (!error) return null;
  
  // Check if error is related to timeout or long processing
  const isTimeoutError = error.toLowerCase().includes('taking too long') || 
                         error.toLowerCase().includes('timeout') || 
                         error.toLowerCase().includes('exceeded');
  
  // Check if error is related to server/connection issues
  const isConnectionError = error.toLowerCase().includes('connection') || 
                           error.toLowerCase().includes('network') ||
                           error.toLowerCase().includes('failed to fetch');
  
  return (
    <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 rounded-lg flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="w-full">
        <p className="font-medium text-destructive">Generation Error</p>
        <p className="text-sm text-destructive/80">{error}</p>
        
        {isTimeoutError && (
          <p className="mt-2 text-xs text-destructive/70">
            3D model generation can take some time. Our service may be experiencing high demand.
            Please try again or use a different image.
          </p>
        )}
        
        {isConnectionError && (
          <p className="mt-2 text-xs text-destructive/70">
            There might be an issue with your internet connection or our service.
            Please check your connection and try again.
          </p>
        )}
        
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
        
        <div className="mt-3 flex gap-3">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="text-sm px-3 py-1 bg-background rounded border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
            >
              Try Again
            </Button>
          )}
          
          {onGoBack && (
            <Button 
              onClick={onGoBack}
              variant="outline" 
              className="text-sm px-3 py-1"
            >
              Go Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
