
import React from 'react';
import { Home, Plus, Cuboid, Users, Book } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const BottomNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Plus, label: 'Create', path: '/create' },
    { icon: Cuboid, label: 'Models', path: '/models' },
    { icon: Users, label: 'Community', path: '/community' },
    { icon: Book, label: 'Learn', path: '/learn' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4 flex justify-around z-10">
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className={cn(
            "flex flex-col items-center px-3 py-2 rounded-lg",
            location.pathname === item.path
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
