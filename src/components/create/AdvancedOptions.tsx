
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useModelGenerationStore } from '@/stores/modelGenerationStore';

export const AdvancedOptions = () => {
  const [expanded, setExpanded] = useState(false);
  const { imageQuality, setImageQuality, useTransparentBackground, setUseTransparentBackground } = useModelGenerationStore();
  
  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        className="flex w-full justify-between items-center text-muted-foreground py-2 px-0"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <Sparkles className="h-4 w-4 mr-2" />
          <span>Advanced Options</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      
      {expanded && (
        <div className="p-4 bg-muted/30 rounded-md space-y-6 mt-2 backdrop-blur-sm">
          <div className="space-y-2">
            <Label>Image Quality</Label>
            <RadioGroup 
              value={imageQuality} 
              onValueChange={(value) => setImageQuality(value as 'low' | 'medium' | 'high')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="cursor-pointer">Low (Faster)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">Medium (Balanced)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="cursor-pointer">High (Best Quality)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="transparent-bg" className="cursor-pointer">Transparent Background</Label>
              <Switch 
                id="transparent-bg"
                checked={useTransparentBackground}
                onCheckedChange={setUseTransparentBackground}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Creates images with transparent backgrounds (useful for product mockups)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
