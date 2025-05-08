
import React from 'react';
import { Loader, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ModelGenerationLoadingProps {
  progress: number;
  estimatedTime: string;
  creditUsage: number;
  onCancel: () => void;
  statusMessage?: string;  // Added statusMessage as optional prop
  hasError?: boolean;      // Added hasError flag
  className?: string;
}

export const ModelGenerationLoading = ({
  progress = 67,
  estimatedTime = "45 sec",
  creditUsage = 1,
  onCancel,
  statusMessage,  // Added statusMessage to destructured props
  hasError = false,
  className,
}: ModelGenerationLoadingProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-screen px-4 py-6 relative bg-background",
      className
    )}>
      {/* Particle effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-pixie-purple/10 animate-pulse"
            style={{
              width: `${Math.random() * 20 + 5}px`,
              height: `${Math.random() * 20 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 5 + 2}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      {/* Loading animation or error icon */}
      <div className="relative mb-8">
        {hasError ? (
          <div className="flex items-center justify-center w-32 h-32 rounded-full bg-white/50 backdrop-blur-md shadow-xl">
            <AlertTriangle className="h-16 w-16 text-destructive animate-pulse" />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 rounded-full bg-pixie-purple/5 animate-ping" 
                style={{ animationDuration: '3s' }} />
            
            <div className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full bg-white/50 backdrop-blur-md shadow-xl">
              <div className="absolute w-24 h-24 rounded-full border-t-2 border-r-2 border-pixie-purple animate-spin"
                  style={{ animationDuration: '2s' }} />
              <div className="absolute w-16 h-16 rounded-full border-t-2 border-l-2 border-pixie-blue animate-spin"
                  style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
              
              <div className="w-20 h-20 flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-pixie-purple to-pixie-blue rounded-lg animate-pulse" 
                    style={{ animationDuration: '1.5s' }} />
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Text and Progress */}
      <h1 className="text-2xl font-bold mb-1 text-center">
        {hasError ? 'Generation Error' : 'Generating your model'}
      </h1>
      <p className={cn(
        "text-lg mb-6 text-center",
        hasError ? "text-destructive" : "text-muted-foreground"
      )}>
        {statusMessage || (hasError ? "Something went wrong" : "Creating magic...")}
      </p>
      
      {!hasError && (
        <div className="w-full max-w-md mb-6 space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress}% complete</span>
            <span>Est. time: {estimatedTime}</span>
          </div>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground mb-8">
        Using <span className="text-foreground font-medium">{creditUsage} credit</span>
      </p>
      
      {/* Action Buttons */}
      {hasError ? (
        <div className="flex gap-4">
          <Button
            variant="default"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      )}
    </div>
  );
};
