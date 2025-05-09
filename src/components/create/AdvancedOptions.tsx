
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';

export const AdvancedOptions: React.FC = () => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  
  return (
    <Collapsible open={isOptionsOpen} onOpenChange={setIsOptionsOpen} className="mb-6 border rounded-lg overflow-hidden">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="font-medium">Advanced Options</span>
        </div>
        {isOptionsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 pt-0 border-t">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Model Style</label>
            <Input placeholder="Low-poly, Realistic, Cartoon..." />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Dimensions</label>
            <Input placeholder="Default" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Format</label>
            <Input placeholder=".OBJ" />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
