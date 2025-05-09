
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface TextInputAreaProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({ prompt, setPrompt }) => {
  return (
    <div className="relative mb-6">
      <Textarea 
        placeholder="Describe your model in detail..." 
        className="min-h-[200px] p-4 resize-y bg-background/60 backdrop-blur-sm border-pixie-purple/20"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="absolute -z-10 top-1/3 left-1/4 w-24 h-24 bg-pixie-blue/5 rounded-full blur-xl" />
      <div className="absolute -z-10 bottom-1/4 right-1/4 w-20 h-20 bg-pixie-purple/5 rounded-full blur-xl" />
    </div>
  );
};
