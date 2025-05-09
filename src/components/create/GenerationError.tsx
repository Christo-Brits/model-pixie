
import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GenerationErrorProps {
  error: string | null;
  details?: string;
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
  
  // Check for specific API errors and provide more helpful messages
  let displayMessage = error;
  let detailMessage = details || '';
  
  if (error.includes('response_format') || error.includes('unknown_parameter')) {
    displayMessage = 'OpenAI API Configuration Error';
    detailMessage = 'There is an issue with our API configuration. Our team has been notified and is working on a fix.';
  } else if (error.includes('insufficient_quota')) {
    displayMessage = 'API Usage Limit Reached';
    detailMessage = 'Our image generation service has reached its usage limit. Please try again later.';
  } else if (error.includes('network') || error.includes('internet') || error.includes('connection')) {
    displayMessage = 'Network Connection Error';
    detailMessage = 'Please check your internet connection and try again.';
  }

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
        <div className="flex-1">
          <h4 className="font-medium text-red-700">{displayMessage}</h4>
          <p className="mt-1 text-sm text-red-600">
            {detailMessage || error}
          </p>
          {!detailMessage && error && (
            <p className="mt-2 text-xs text-red-500">
              Error details: {error}
            </p>
          )}
        </div>
      </div>
      
      {(onRetry || onGoBack) && (
        <div className="mt-4 flex gap-3">
          {onGoBack && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGoBack}
              className="border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
            >
              <ArrowLeft className="mr-2 h-3 w-3" />
              Go Back
            </Button>
          )}
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
