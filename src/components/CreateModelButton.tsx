
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CreateModelButton = () => {
  return (
    <Link to="/create" className="w-full max-w-xs">
      <Button 
        size="lg" 
        className="w-full bg-pixie-purple hover:bg-pixie-purple/90 text-white gap-2 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        <PlusCircle className="h-5 w-5" />
        <span className="text-lg font-medium">Create New Model</span>
      </Button>
    </Link>
  );
};
