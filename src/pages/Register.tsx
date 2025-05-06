
import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { RegistrationForm } from "@/components/RegistrationForm";
import { ModelShowcase } from "@/components/ModelShowcase";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-purple-50 px-6 py-8">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Logo size="md" />
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Create your account
        </h1>
        <p className="text-muted-foreground">
          Join ModelPixie and bring your ideas to life
        </p>
      </div>
      
      <div className="flex-1 relative">
        {/* Background decorative elements */}
        <div className="absolute -z-10 opacity-5 blur-lg">
          <ModelShowcase />
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
