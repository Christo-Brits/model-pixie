
import React from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const tips = [
  "For smooth prints, try using a layer height of 0.1-0.2mm.",
  "Adding supports to overhanging features improves print success rate.",
  "Hollow models use less material but require proper drainage holes.",
  "Consider the orientation of your model to minimize support structures."
];

export const QuickTip = () => {
  // Get a random tip from the array
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  return (
    <Card className="p-4 bg-muted/30 border border-primary/10">
      <div className="flex gap-3">
        <div className="shrink-0 bg-primary/10 p-2 rounded-full h-fit">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-1">Quick Tip</h3>
          <p className="text-sm text-muted-foreground">{randomTip}</p>
        </div>
      </div>
    </Card>
  );
};
