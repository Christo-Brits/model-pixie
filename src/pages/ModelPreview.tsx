
import React, { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { RotateCw, RotateCcw, ZoomIn, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { ModelViewer } from '@/components/ModelViewer';

const ModelPreview = () => {
  const [isRefinementOpen, setIsRefinementOpen] = useState(true);
  const [smoothness, setSmoothness] = useState([65]);
  const [detailLevel, setDetailLevel] = useState([80]);

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopBar />
      
      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Model Preview</h1>
        
        {/* 3D Model Viewer */}
        <div className="relative bg-gradient-to-b from-background to-muted/30 rounded-xl mb-6 overflow-hidden h-[40vh] sm:h-[50vh] shadow-lg">
          <ModelViewer modelType="dragon" />
          
          {/* Controls overlay */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button variant="secondary" size="icon" className="rounded-full bg-background/70 backdrop-blur-sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full bg-background/70 backdrop-blur-sm">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full bg-background/70 backdrop-blur-sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Refinement Options */}
        <Collapsible 
          open={isRefinementOpen} 
          onOpenChange={setIsRefinementOpen}
          className="mb-6 border rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="font-medium">Refinement Options</span>
            </div>
            {isRefinementOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 border-t">
            <div className="space-y-6 py-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Smoothness</label>
                  <span className="text-sm text-muted-foreground">{smoothness}%</span>
                </div>
                <Slider
                  value={smoothness}
                  onValueChange={setSmoothness}
                  max={100}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Detail Level</label>
                  <span className="text-sm text-muted-foreground">{detailLevel}%</span>
                </div>
                <Slider
                  value={detailLevel}
                  onValueChange={setDetailLevel}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="gap-2">
              <RotateCw className="h-4 w-4" />
              Regenerate
            </Button>
            <Button className="gap-2 pixie-gradient text-white shadow-lg">
              Download
            </Button>
          </div>
          
          <Button variant="ghost" className="gap-2 justify-center">
            <Share2 className="h-4 w-4" />
            Share to Community
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ModelPreview;
