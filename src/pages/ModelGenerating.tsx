
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ModelGenerationLoading } from '@/components/ModelGenerationLoading';
import { ModelGenerationProcess } from '@/components/ModelGenerationProcess';
import { Button } from '@/components/ui/button';
import { checkJobStatus } from '@/services/jobStatusService';
import { generatedModel } from '@/services/modelGenerationService'; // Import a helper function that may exist
import { GenerationError } from '@/components/create/GenerationError';
import { useAuth } from '@/hooks/useAuth';

const ModelGenerating = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [progress, setProgress] = useState<number>(10);
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("Starting model generation...");
  const [error, setError] = useState<Error | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  
  // useEffect to initialize job ID and image URL from location state or localStorage
  useEffect(() => {
    const state = location.state as any;
    const locJobId = state?.jobId || localStorage.getItem('currentJobId');
    const locSelectedImageUrl = state?.selectedImageUrl || localStorage.getItem('selectedImageUrl');
    
    console.log(`ModelGenerating - Job ID: ${locJobId}, Selected Image URL: ${locSelectedImageUrl}`);
    
    if (locJobId) {
      setJobId(locJobId);
      // Store job ID in localStorage for potential recovery
      localStorage.setItem('currentJobId', locJobId);
    } else {
      console.error("No job ID provided for model generation");
      setError(new Error("No job ID provided. Please start a new generation."));
    }
    
    if (locSelectedImageUrl) {
      setSelectedImageUrl(locSelectedImageUrl);
      // Store selected image URL in localStorage for potential recovery
      localStorage.setItem('selectedImageUrl', locSelectedImageUrl);
    }
  }, [location.state]);
  
  // Handle status update from the generation process
  const handleStatusUpdate = (status: string, progressUpdate: number) => {
    setStatusMessage(status);
    setProgress(progressUpdate);
  };
  
  // Handle errors from the generation process
  const handleError = (error: Error) => {
    console.error("Model generation error:", error);
    setError(error);
    toast.error("Generation failed", {
      description: error.message,
    });
  };
  
  // Handle a prediction ID being set
  const handlePredictionIdSet = (id: string | null) => {
    setPredictionId(id);
  };

  // Handle cancellation of the generation process
  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel this generation?")) {
      try {
        // Update job status if needed
        if (jobId) {
          // You would need to implement this function
          // await updateJobStatus(jobId, 'cancelled');
        }
        
        navigate('/create');
        
      } catch (error) {
        console.error("Error cancelling generation:", error);
        toast.error("Failed to cancel generation");
      }
    }
  };

  // Handle retry of the generation process
  const handleRetry = () => {
    setError(null);
    setProgress(10);
    setStatusMessage("Restarting model generation...");
    
    // Small delay to allow UI to update
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Handle going back to the previous screen
  const handleGoBack = () => {
    navigate('/select-image', {
      state: { jobId }
    });
  };

  // Redirect to preview when the prediction is ready
  useEffect(() => {
    if (predictionId && predictionId !== "pending") {
      // Wait for a moment to show the completion state before redirecting
      const timer = setTimeout(() => {
        navigate('/preview', {
          state: {
            jobId,
            imageUrl: selectedImageUrl,
            usingBlenderWorkflow: true,
            downloadComplete: false
          }
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [predictionId, jobId, selectedImageUrl, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-background">
          <div className="w-full max-w-md">
            <GenerationError 
              error={error.message}
              details="There was an issue with the model generation process."
              onRetry={handleRetry}
              onGoBack={handleGoBack}
            />
            
            <div className="mt-8 text-center">
              <Button
                onClick={() => navigate('/create')}
                variant="outline"
              >
                Return to Create
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ModelGenerationLoading 
            progress={progress}
            estimatedTime={progress < 50 ? "1-2 min" : "less than 1 min"}
            creditUsage={1}
            onCancel={handleCancel}
            statusMessage={statusMessage}
          />
          
          {jobId && (
            <ModelGenerationProcess
              jobId={jobId}
              selectedImageUrl={selectedImageUrl}
              onStatusUpdate={handleStatusUpdate}
              onError={handleError}
              onPredictionIdSet={handlePredictionIdSet}
            />
          )}
        </>
      )}
      
      <BottomNavigation />
    </div>
  );
};

export default ModelGenerating;
