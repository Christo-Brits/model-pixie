import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { createJob } from '@/services/jobCreationService';
import { generateImages, addTestCredits } from '@/services/generationService';
import { useCredits } from '@/hooks/useCredits';

// Import the extracted components
import { InputModeToggle } from '@/components/create/InputModeToggle';
import { TextInputArea } from '@/components/create/TextInputArea';
import { SketchInputArea } from '@/components/create/SketchInputArea';
import { GenerationError } from '@/components/create/GenerationError';
import { AdvancedOptions } from '@/components/create/AdvancedOptions';
import { GenerateButton } from '@/components/create/GenerateButton';
import { TestCreditsButton } from '@/components/create/TestCreditsButton';

const Create = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, refetchCredits } = useCredits();
  const [inputMode, setInputMode] = useState<"text" | "sketch">("text");
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Clear error when component unmounts or when prompt changes
  useEffect(() => {
    setGenerationError(null);
  }, [prompt]);

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Please sign in", {
        description: 'You need to be signed in to generate models',
      });
      navigate('/auth');
      return;
    }
    
    if (!prompt.trim()) {
      toast.error("Please enter a description", {
        description: 'You need to describe what you want to create',
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      // First create the job
      const jobData = await createJob(user.id, prompt);
      
      if (!jobData || !jobData.id) {
        throw new Error('Failed to create job');
      }
      
      const jobId = jobData.id;
      
      // Store jobId in localStorage
      localStorage.setItem('currentJobId', jobId);
      
      // Generate images using the job ID
      const generationData = await generateImages(jobId, prompt);
      
      // Check if the generation was successful
      if (!generationData || generationData.error) {
        throw new Error(generationData?.error || 'Failed to generate images');
      }
      
      // Navigate to the appropriate next screen based on the response
      if (generationData?.job?.status === 'images_ready') {
        // If images are ready, go to image selection
        navigate('/select-image', { state: { jobId } });
      } else {
        // Otherwise, go to generating page to wait for images
        navigate('/generating', { state: { jobId } });
      }
      
    } catch (error) {
      console.error('Error during generation:', error);
      setGenerationError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      toast.error("Generation failed", {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      
      // We don't navigate away on error, allowing the user to retry
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTestCredits = async () => {
    if (!user) {
      toast.error("Please sign in", {
        description: 'You need to be signed in to add test credits',
      });
      navigate('/auth');
      return;
    }

    try {
      setIsAddingCredits(true);
      
      // Add 10 test credits
      await addTestCredits(user.id, 10);
      
      // Refresh the credits display
      await refetchCredits();
      
      toast.success("Test credits added", {
        description: '10 test credits have been added to your account',
      });
      
    } catch (error) {
      console.error('Error adding test credits:', error);
      toast.error("Failed to add test credits", {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsAddingCredits(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopBar />
      
      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Create Your Model</h1>
        
        <InputModeToggle inputMode={inputMode} setInputMode={setInputMode} />
        
        {inputMode === "text" ? (
          <TextInputArea prompt={prompt} setPrompt={setPrompt} />
        ) : (
          <SketchInputArea />
        )}
        
        <GenerationError error={generationError} />
        
        <AdvancedOptions />
        
        <div className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground">
            This will use <span className="font-medium text-foreground">1 credit</span>
          </div>
          
          <GenerateButton 
            isGenerating={isGenerating} 
            user={user} 
            onGenerate={handleGenerate} 
          />
          
          <TestCreditsButton 
            isAddingCredits={isAddingCredits} 
            user={user} 
            onAddTestCredits={handleAddTestCredits} 
          />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Create;
