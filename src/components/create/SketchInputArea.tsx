
import React from 'react';
import { PenLine } from 'lucide-react';

export const SketchInputArea: React.FC = () => {
  return (
    <div className="relative mb-6 border-2 border-dashed border-pixie-purple/20 rounded-lg min-h-[200px] flex items-center justify-center bg-background/60">
      <div className="text-center text-muted-foreground">
        <PenLine className="mx-auto mb-2 h-8 w-8" />
        <p>Tap to start sketching</p>
      </div>
      <div className="absolute -z-10 top-1/3 left-1/4 w-24 h-24 bg-pixie-blue/5 rounded-full blur-xl" />
      <div className="absolute -z-10 bottom-1/4 right-1/4 w-20 h-20 bg-pixie-purple/5 rounded-full blur-xl" />
    </div>
  );
};
