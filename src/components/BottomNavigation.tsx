
import React from 'react';
import { Home, Plus, Cube, Book } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/', active: true },
  { icon: Plus, label: 'Create', path: '/create', active: false },
  { icon: Cube, label: 'Models', path: '/models', active: false },
  { icon: Book, label: 'Learn', path: '/learn', active: false },
];

export const BottomNavigation = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4 flex justify-around z-10">
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className={cn(
            "flex flex-col items-center px-3 py-2 rounded-lg",
            item.active 
              ? "text-pixie-purple" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className="h-6 w-6" />
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};
