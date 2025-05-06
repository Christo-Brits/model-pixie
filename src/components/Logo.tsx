
import React from "react";
import { Box3d } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Logo = ({ size = "md", className }: LogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Box3d 
          className={cn(
            "animate-pulse-soft text-pixie-purple", 
            sizeClasses[size]
          )} 
          size={size === "lg" ? 42 : size === "md" ? 28 : 24}
        />
        <div className="absolute inset-0 bg-pixie-blue blur-md rounded-full opacity-30 animate-pulse-soft"></div>
      </div>
      <div className={cn(
        "font-bold tracking-tight", 
        sizeClasses[size]
      )}>
        <span>Model</span>
        <span className="text-pixie-purple">Pixie</span>
        <span className="text-pixie-blue text-sm align-top">AI</span>
      </div>
    </div>
  );
};
