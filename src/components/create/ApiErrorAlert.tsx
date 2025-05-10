
import React from 'react';
import { AlertTriangle, Info, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiErrorAlertProps {
  errorMessage: string | null;
  onRetry?: () => void;
}

export const ApiErrorAlert: React.FC<ApiErrorAlertProps> = ({ 
  errorMessage,
  onRetry
}) => {
  if (!errorMessage) return null;

  // Determine error type and show appropriate message
  let icon = <AlertTriangle className="h-5 w-5 text-red-500" />;
  let title = "Generation Error";
  let description = errorMessage;
  let actionText = "Try Again";
  let helpText = null;

  if (errorMessage.includes('response_format') || errorMessage.includes('unknown_parameter')) {
    icon = <Info className="h-5 w-5 text-amber-500" />;
    title = "API Configuration Issue";
    description = "We're experiencing temporary issues with our image generation service.";
    helpText = "Our team has been notified and is working to fix this. Please try again later.";
  } else if (errorMessage.includes('insufficient_quota')) {
    icon = <Info className="h-5 w-5 text-amber-500" />;
    title = "Service Temporarily Unavailable";
    description = "Our image generation quota has been reached.";
    helpText = "The service will be available again soon. Please try again later.";
  } else if (errorMessage.includes('connection') || errorMessage.includes('network')) {
    icon = <Wifi className="h-5 w-5 text-amber-500" />;
    title = "Connection Issue";
    description = "There might be an issue with your internet connection.";
    helpText = "Please check your connection and try again.";
  }

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex-1">
          <h4 className="font-medium text-red-700">{title}</h4>
          <p className="text-sm text-red-600 mt-1">{description}</p>
          {helpText && <p className="text-xs text-red-500 mt-1">{helpText}</p>}
        </div>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="shrink-0 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            {actionText}
          </Button>
        )}
      </div>
      <div className="mt-2 text-xs text-red-500 bg-red-100/50 p-2 rounded overflow-auto max-h-24">
        <details>
          <summary className="cursor-pointer">Error details</summary>
          <code className="block mt-1 whitespace-pre-wrap">{errorMessage}</code>
        </details>
      </div>
    </div>
  );
};
