
import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export const OnboardingProgress = ({ 
  currentStep, 
  totalSteps,
  className 
}: OnboardingProgressProps) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground font-medium">
          {currentStep} of {totalSteps}
        </span>
      </div>
      
      <Progress 
        value={progress} 
        className="h-1.5 bg-muted" 
      />
      
      <div className="flex justify-center space-x-2 mt-1">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div 
            key={index}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              index < currentStep 
                ? "bg-pixie-purple" 
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
