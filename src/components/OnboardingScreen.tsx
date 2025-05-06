
import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { TutorialIllustration } from "@/components/TutorialIllustration";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const OnboardingScreen = () => {
  const navigate = useNavigate();
  
  const handleSkip = () => {
    navigate("/register");
  };
  
  const handleNext = () => {
    // In a real app, this would go to the next onboarding screen
    // For now, we'll just redirect to registration
    navigate("/register");
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-purple-50 px-6 py-12">
      <div className="mb-8 flex justify-center">
        <Logo size="md" />
      </div>
      
      <div className="w-full max-w-md mx-auto">
        <OnboardingProgress currentStep={1} totalSteps={4} className="mb-8" />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <TutorialIllustration className="h-72" />
        
        <div className="text-center mt-8 mb-12">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Create stunning 3D models
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            With simple text descriptions or sketches, bring your ideas to life in three dimensions.
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-md mx-auto mt-auto flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="text-muted-foreground"
          onClick={handleSkip}
        >
          Skip
        </Button>
        
        <Button 
          className="bg-pixie-purple hover:bg-pixie-purple/90 text-white"
          onClick={handleNext}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
