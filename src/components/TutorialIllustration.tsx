
import React from "react";
import { cn } from "@/lib/utils";
import { Cuboid, FileText, ArrowRight } from "lucide-react";

interface TutorialIllustrationProps {
  className?: string;
}

export const TutorialIllustration = ({ className }: TutorialIllustrationProps) => {
  return (
    <div className={cn("relative w-full h-64 my-8", className)}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-pixie-purple/10 via-transparent to-pixie-blue/10 rounded-3xl"></div>
      
      {/* Text to 3D model illustration */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-md rounded-lg p-4 animate-float z-10">
        <FileText className="text-gray-700 h-12 w-12" />
        <div className="mt-2 text-xs text-center font-medium">Text prompt</div>
      </div>
      
      {/* Arrow animation */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <ArrowRight className="h-10 w-10 text-pixie-purple animate-pulse-soft" />
      </div>
      
      {/* 3D Model result */}
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-md rounded-lg p-4 animate-float-delay z-10">
        <div className="relative">
          <Cuboid className="text-pixie-purple h-12 w-12" />
          <div className="absolute inset-0 bg-pixie-blue blur-md rounded-full opacity-30 animate-pulse-soft"></div>
        </div>
        <div className="mt-2 text-xs text-center font-medium">3D Model</div>
      </div>
      
      {/* Center decorative element */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pixie-purple/20 to-pixie-blue/20 animate-rotate-slow blur-xl"></div>
      </div>
    </div>
  );
};
