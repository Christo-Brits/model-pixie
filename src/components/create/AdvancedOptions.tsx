
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp, Sparkles, RefreshCw, Paintbrush } from 'lucide-react';
import { useModelGenerationStore } from '@/stores/modelGenerationStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const AdvancedOptions = () => {
  const [expanded, setExpanded] = useState(false);
  const { 
    imageQuality, 
    setImageQuality, 
    useTransparentBackground, 
    setUseTransparentBackground,
    randomSeed,
    setRandomSeed,
    generateNewRandomSeed
  } = useModelGenerationStore();
  
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
            <div className="flex items-center justify-between">
              <Label>Image Quality</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">GPT-Image-1</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-56 text-xs">Uses OpenAI's GPT-Image-1 model for high-quality image generation optimized for 3D modeling</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Random Seed</Label>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 text-xs gap-1.5" 
                onClick={generateNewRandomSeed}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Randomize
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-muted-foreground flex-1">
                {randomSeed ? `Current seed: ${randomSeed}` : 'Using a random seed each time'}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setRandomSeed(undefined)}
              >
                Clear
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Using the same seed allows you to recreate similar images with different prompts
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="flex gap-2">
              <Paintbrush className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Optimized for 3D Modeling</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  These settings help create images that work well with the Meshy plugin in Blender
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
