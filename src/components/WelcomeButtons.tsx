
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface WelcomeButtonsProps {
  className?: string;
}

export const WelcomeButtons = ({ className }: WelcomeButtonsProps) => {
  return (
    <div className={cn("flex flex-col space-y-4 w-full", className)}>
      <Link to="/onboarding" className="w-full">
        <Button 
          className="bg-pixie-purple hover:bg-pixie-purple/90 text-white font-medium py-6 w-full"
          size="lg"
        >
          Get Started
        </Button>
      </Link>
      <Link to="/register" className="w-full">
        <Button 
          variant="outline" 
          className="border-pixie-purple text-pixie-purple hover:bg-pixie-purple/10 font-medium py-6 w-full"
          size="lg"
        >
          Sign Up
        </Button>
      </Link>
      <div className="text-center mt-4">
        <a 
          href="#" 
          className="text-sm text-muted-foreground hover:text-pixie-purple transition-colors"
        >
          Continue as Guest
        </a>
      </div>
    </div>
  );
};
