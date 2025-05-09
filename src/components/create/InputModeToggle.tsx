
import React from 'react';
import { Text, PenLine } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface InputModeToggleProps {
  inputMode: "text" | "sketch";
  setInputMode: (mode: "text" | "sketch") => void;
}

export const InputModeToggle: React.FC<InputModeToggleProps> = ({ inputMode, setInputMode }) => {
  return (
    <div className="mb-6">
      <ToggleGroup 
        type="single" 
        value={inputMode} 
        onValueChange={(value) => value && setInputMode(value as "text" | "sketch")}
      >
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
  );
};
