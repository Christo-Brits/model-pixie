
import React, { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Search, Check, RotateCcw } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  name: string;
  status: 'completed' | 'processing';
  type: string;
}

const ModelCard: React.FC<ModelCardProps> = ({ name, status, type }) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all">
      <div className="aspect-square relative bg-muted flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-pixie-purple/10 to-pixie-blue/10" />
        
        {/* Status indicator */}
        <div className="absolute top-2 right-2 z-10">
          {status === 'completed' ? (
            <div className="bg-green-500 rounded-full p-1">
              <Check className="h-3 w-3 text-white" />
            </div>
          ) : (
            <div className="bg-amber-500 rounded-full p-1">
              <RotateCcw className="h-3 w-3 text-white animate-spin-slow" />
            </div>
          )}
        </div>
        
        {/* Model icon - using different styling based on type */}
        <div 
          className={cn(
            "h-12 w-12", 
            type === 'figurine' && "text-pixie-purple/70",
            type === 'practical' && "text-pixie-blue/70",
            type === 'decorative' && "text-pixie-pink/70"
          )}
        >
          {/* Different visual representation based on model type */}
          {type === 'figurine' && <div className="h-full w-full rounded-lg bg-pixie-purple/20 flex items-center justify-center">F</div>}
          {type === 'practical' && <div className="h-full w-full rounded-lg bg-pixie-blue/20 flex items-center justify-center">P</div>}
          {type === 'decorative' && <div className="h-full w-full rounded-lg bg-pixie-pink/20 flex items-center justify-center">D</div>}
        </div>
      </div>
      <div className="p-2 bg-background">
        <p className="text-sm font-medium text-center truncate">{name}</p>
      </div>
    </div>
  );
};

const modelData: ModelCardProps[] = [
  { name: "Robot Figurine", status: 'completed', type: 'figurine' },
  { name: "Desk Organizer", status: 'completed', type: 'practical' },
  { name: "Phone Stand", status: 'processing', type: 'practical' },
  { name: "Geometric Vase", status: 'completed', type: 'decorative' },
  { name: "Custom Keychain", status: 'processing', type: 'figurine' },
  { name: "Decorative Bowl", status: 'completed', type: 'decorative' },
  { name: "Chess Piece", status: 'completed', type: 'figurine' },
  { name: "Pen Holder", status: 'completed', type: 'practical' },
  { name: "Wall Art", status: 'processing', type: 'decorative' },
];

const Models = () => {
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  
  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopBar />
      
      <main className="flex-1 px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Models</h1>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Search className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex gap-3 mb-6">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="figurine">Figurines</SelectItem>
              <SelectItem value="practical">Practical</SelectItem>
              <SelectItem value="decorative">Decorative</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {modelData.map((model, index) => (
            <ModelCard 
              key={index} 
              name={model.name} 
              status={model.status} 
              type={model.type} 
            />
          ))}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Models;
