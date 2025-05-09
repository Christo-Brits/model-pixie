
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModelGenerationLoading } from '@/components/ModelGenerationLoading';
import { toast } from '@/components/ui/sonner';
import { updateJobStatus } from '@/services/jobStatusService';
import { ModelGenerationProcess } from '@/components/ModelGenerationProcess';
import { ModelStatusChecker } from '@/components/ModelStatusChecker';
import { GenerationError } from '@/components/create/GenerationError';

const ModelGenerating = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(10);
  const [statusMessage, setStatusMessage] = useState('Initializing model generation...');
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Extract jobId and selected image info from location state or fallback
  const jobId = location.state?.jobId || localStorage.getItem('currentJobId');
  
  // Get image URL with fallbacks
  const selectedImageUrl = 
    location.state?.selectedImageUrl || 
    localStorage.getItem('selectedImageUrl') ||
    (location.state?.selectedVariationId && location.state?.imageVariations ? 
      location.state.imageVariations.find(v => v.id === location.state.selectedVariationId)?.url : 
      null);
  
  // Log state information for debugging
  console.log('ModelGenerating - Selected Image URL:', selectedImageUrl);
  console.log('ModelGenerating - Location state:', location.state);
  console.log('ModelGenerating - JobId:', jobId);
  
  // Check if we have the necessary data on component mount
  useEffect(() => {
    if (!jobId) {
      toast.error("Error", {
        description: 'No job ID found. Unable to track progress.'
      });
      navigate('/create');
      return;
    }
    
    // If we don't have an image URL and we're not already handling an error
    if (!selectedImageUrl && !hasError && !isRedirecting) {
      console.log('No image selected, redirecting to image selection');
      setIsRedirecting(true);
      
      toast.error("No image selected", {
        description: 'Please select an image for model generation'
      });
      
      // Use setTimeout to ensure the toast is displayed before redirecting
      setTimeout(() => {
        navigate('/select-image', { state: { jobId } });
      }, 1000);
    }
  }, [jobId, selectedImageUrl, navigate, hasError, isRedirecting]);
  
  // Handle status updates from child components
  const handleStatusUpdate = (message: string, newProgress: number) => {
    console.log(`Status update: ${message}, Progress: ${newProgress}`);
    
    if (message) {
      setStatusMessage(message);
    }
    
    if (newProgress === -1) {
      // Special case for progressive increments
      setProgress(prevProgress => {
        // Only auto-increment progress if we're below 95% and we don't have an error
        if (!hasError && prevProgress < 95) {
          const newValue = prevProgress + 1;
          console.log(`Auto-incrementing progress from ${prevProgress} to ${newValue}`);
          return newValue;
        }
        return prevProgress;
      });
    } else if (newProgress > 0) {
      // Only update progress if it's a valid value
      console.log(`Setting direct progress value: ${newProgress}`);
      setProgress(newProgress);
    }
  };
  
  // Handle errors from child components
  const handleError = async (error: Error) => {
    setHasError(true);
    setErrorMessage(error.message || 'Unknown error occurred');
    setStatusMessage(`Generation error: ${error.message || 'Unknown error'}`);
    
    toast.error("Generation Error", {
      description: error.message || 'Failed to start model generation'
    });
    
    // Update job status to error
    try {
      await updateJobStatus(jobId, 'error');
    } catch (statusError) {
      console.error('Failed to update job status:', statusError);
    }
  };
  
  // Handle prediction ID update
  const handlePredictionIdSet = (id: string | null) => {
    console.log(`Setting prediction ID: ${id}`);
    setPredictionId(id);
    
    // Store predictionId in localStorage for potential recovery
    if (id) {
      localStorage.setItem('currentPredictionId', id);
    }
  };
  
  const handleCancel = async () => {
    try {
      // Update job status to cancelled
      await updateJobStatus(jobId, 'cancelled');
      
      toast.success('Generation cancelled', {
        description: 'Your credit has been returned to your account.'
      });
      navigate('/create');
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  const handleRetry = () => {
    // Reset state
    setHasError(false);
    setErrorMessage(null);
    setPredictionId(null);
    setProgress(10);
    setStatusMessage('Restarting model generation...');
    
    // Force reload to restart the process
    window.location.reload();
  };
  
  const handleGoBack = () => {
    // Go back to create page or image selection page depending on the error
    if (errorMessage && errorMessage.toLowerCase().includes('no image')) {
      navigate('/select-image', { state: { jobId } });
    } else {
      navigate('/create');
    }
  };
  
  // Don't render the generation components if we're missing essential data or redirecting
  if (!jobId || isRedirecting) {
    return null;
  }
  
  return (
    <>
      {hasError && errorMessage ? (
        <GenerationError 
          error={errorMessage}
          details="The model generation process encountered an error. This could be due to server issues or problems with the input image."
          onRetry={handleRetry}
          onGoBack={handleGoBack}
        />
      ) : selectedImageUrl && !predictionId ? (
        <ModelGenerationProcess 
          jobId={jobId}
          selectedImageUrl={selectedImageUrl}
          onStatusUpdate={handleStatusUpdate}
          onError={handleError}
          onPredictionIdSet={handlePredictionIdSet}
        />
      ) : null}
      
      {!hasError && predictionId && selectedImageUrl && (
        <ModelStatusChecker
          jobId={jobId}
          predictionId={predictionId}
          selectedImageUrl={selectedImageUrl}
          hasError={hasError}
          onStatusUpdate={handleStatusUpdate}
          onError={handleError}
        />
      )}
      
      <ModelGenerationLoading 
        progress={progress} 
        estimatedTime={progress < 80 ? "5-7 min" : "Almost done"}
        creditUsage={1}
        onCancel={handleCancel}
        statusMessage={statusMessage}
        hasError={hasError}
      />
    </>
  );
};

export default ModelGenerating;
