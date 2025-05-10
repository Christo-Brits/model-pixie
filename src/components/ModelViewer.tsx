
import React from 'react';

interface ModelViewerProps {
  modelUrl?: string;
  modelType?: string;
  className?: string;
}

export const ModelViewer = ({ modelUrl, modelType = "dragon", className }: ModelViewerProps) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Placeholder for 3D model - in a real app, this would use three.js or similar */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          {/* Model representation with lighting effects */}
          <div 
            className={`
              w-64 h-64 bg-gradient-to-br from-pixie-purple/30 via-transparent to-pixie-blue/30 
              rounded-lg transform rotate-12 relative overflow-hidden
            `}
          >
            {modelType === "dragon" && (
              <>
                {/* Stylized dragon silhouette */}
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-pixie-purple/60 rounded-full blur-sm"></div>
                <div className="absolute bottom-1/4 right-1/3 w-1/3 h-1/3 bg-pixie-blue/60 rounded-full blur-sm"></div>
                <div className="absolute top-1/3 right-1/4 w-1/4 h-1/2 bg-pixie-purple/40 skew-y-12 rounded-md"></div>
                <div className="absolute bottom-1/3 left-1/5 w-1/3 h-1/4 bg-pixie-blue/50 -skew-y-12 rounded-md"></div>
                
                {/* Simulated light reflections */}
                <div className="absolute top-1/6 left-1/6 w-8 h-8 bg-white/50 rounded-full blur-md"></div>
                <div className="absolute bottom-1/6 right-1/6 w-6 h-6 bg-white/40 rounded-full blur-md"></div>
                
                {/* Animated pulse to suggest interactivity */}
                <div className="absolute inset-0 bg-white/5 animate-pulse rounded-lg"></div>
              </>
            )}
          </div>
          
          {/* Visual cue to suggest 3D and rotation */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-3 bg-black/10 blur-md rounded-full"></div>
        </div>
      </div>
      
      {/* Overlay text to indicate this is a placeholder */}
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded backdrop-blur-sm">
        Interactive 3D Model {modelUrl ? '(URL: ' + modelUrl.substring(0, 15) + '...)' : ''}
      </div>
    </div>
  );
};
