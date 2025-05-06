
import React, { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Text, PenLine, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const Create = () => {
  const [inputMode, setInputMode] = useState<"text" | "sketch">("text");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopBar />
      
      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Create Your Model</h1>
        
        <div className="mb-6">
          <ToggleGroup type="single" value={inputMode} onValueChange={(value) => value && setInputMode(value as "text" | "sketch")}>
            <ToggleGroupItem value="text" aria-label="Text input mode">
              <Text className="mr-2" />
              Text
            </ToggleGroupItem>
            <ToggleGroupItem value="sketch" aria-label="Sketch input mode">
              <PenLine className="mr-2" />
              Sketch
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {inputMode === "text" ? (
          <div className="relative mb-6">
            <Textarea 
              placeholder="Describe your model in detail..." 
              className="min-h-[200px] p-4 resize-y bg-background/60 backdrop-blur-sm border-pixie-purple/20"
            />
            <div className="absolute -z-10 top-1/3 left-1/4 w-24 h-24 bg-pixie-blue/5 rounded-full blur-xl" />
            <div className="absolute -z-10 bottom-1/4 right-1/4 w-20 h-20 bg-pixie-purple/5 rounded-full blur-xl" />
          </div>
        ) : (
          <div className="relative mb-6 border-2 border-dashed border-pixie-purple/20 rounded-lg min-h-[200px] flex items-center justify-center bg-background/60">
            <div className="text-center text-muted-foreground">
              <PenLine className="mx-auto mb-2 h-8 w-8" />
              <p>Tap to start sketching</p>
            </div>
            <div className="absolute -z-10 top-1/3 left-1/4 w-24 h-24 bg-pixie-blue/5 rounded-full blur-xl" />
            <div className="absolute -z-10 bottom-1/4 right-1/4 w-20 h-20 bg-pixie-purple/5 rounded-full blur-xl" />
          </div>
        )}
        
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
        
        <div className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground">
            This will use <span className="font-medium text-foreground">1 credit</span>
          </div>
          
          <Button className="gap-2 pixie-gradient text-white shadow-lg py-6">
            <Sparkles className="h-5 w-5" />
            Generate
          </Button>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Create;
