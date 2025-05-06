
import React from "react";
import { cn } from "@/lib/utils";
import { Cuboid, Box, User } from "lucide-react";

interface ModelItemProps {
  icon: React.ElementType;
  position: string;
  delay: string;
  color: string;
}

const ModelItem = ({ icon: Icon, position, delay, color }: ModelItemProps) => {
  return (
    <div
      className={cn(
        "absolute z-10 rounded-xl shadow-lg p-4 backdrop-blur-lg bg-white/20",
        position,
        delay
      )}
    >
      <Icon className={cn("h-8 w-8", color)} />
    </div>
  );
};

export const ModelShowcase = () => {
  return (
    <div className="relative w-full h-64">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-pixie-purple/10 via-transparent to-pixie-blue/10 rounded-3xl"></div>
      
      {/* Floating 3D model thumbnails */}
      <ModelItem 
        icon={Cuboid} 
        position="top-4 left-8" 
        delay="animate-float" 
        color="text-pixie-purple"
      />
      <ModelItem 
        icon={Box} 
        position="bottom-6 left-16" 
        delay="animate-float-delay" 
        color="text-pixie-blue"
      />
      <ModelItem 
        icon={User} 
        position="top-16 right-12"
        delay="animate-float-delay-2" 
        color="text-pixie-pink"
      />
      <ModelItem 
        icon={Box} 
        position="bottom-10 right-8" 
        delay="animate-float" 
        color="text-pixie-lightPurple"
      />
      
      {/* Center decorative element */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pixie-purple/30 to-pixie-blue/30 animate-rotate-slow blur-xl"></div>
      </div>
    </div>
  );
};
