
import * as React from "react";
import { cn } from "@/lib/utils";

export interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  vertical?: boolean;
}

export interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
}

export const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ className, vertical = false, children, ...props }, ref) => {
    const stepsCount = React.Children.count(children);
    const childrenArray = React.Children.toArray(children);
    
    return (
      <div
        ref={ref}
        className={cn(
          "steps",
          vertical ? "flex flex-col gap-2" : "flex flex-col md:flex-row gap-4",
          className
        )}
        {...props}
      >
        {React.Children.map(childrenArray, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<StepProps>, {
              stepNumber: index + 1,
              isLast: index === stepsCount - 1,
              vertical,
            });
          }
          return child;
        })}
      </div>
    );
  }
);

Steps.displayName = "Steps";

export const Step = React.forwardRef<HTMLDivElement, StepProps & { stepNumber?: number; isLast?: boolean; vertical?: boolean }>(
  ({ className, title, children, stepNumber, isLast, vertical = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "step relative",
          vertical ? "pb-8" : "flex-1 pb-4",
          !isLast && vertical && "border-l-2 border-muted-foreground/20 ml-4 pl-8",
          !isLast && !vertical && "border-t-2 border-muted-foreground/20 mt-4 pt-8",
          className
        )}
        {...props}
      >
        <div className={cn(
          "step-circle absolute flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold",
          vertical ? "-left-4 top-0" : "-top-4 left-0"
        )}>
          {stepNumber}
        </div>
        <div className={cn("step-content", vertical ? "" : "mt-4")}>
          <div className="step-title text-lg font-semibold mb-2">{title}</div>
          <div className="step-description text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    );
  }
);

Step.displayName = "Step";
