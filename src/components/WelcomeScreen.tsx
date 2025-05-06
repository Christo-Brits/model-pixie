
import React from "react";
import { Logo } from "@/components/Logo";
import { ModelShowcase } from "@/components/ModelShowcase";
import { WelcomeButtons } from "@/components/WelcomeButtons";

export const WelcomeScreen = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-purple-50 px-6 py-12">
      <div className="flex-1 flex flex-col">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text mb-2">
            Turn your ideas into 3D prints
          </h1>
          <p className="text-muted-foreground">
            Describe what you imagine. We'll make it printable.
          </p>
        </div>
        
        <div className="flex-1 flex items-center justify-center my-4">
          <ModelShowcase />
        </div>
        
        <div className="mt-auto w-full max-w-md mx-auto">
          <WelcomeButtons />
        </div>
      </div>
    </div>
  );
};
