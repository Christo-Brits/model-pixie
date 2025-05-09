
import React, { useState } from 'react';
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
  const [progress, setProgress] = useState(10); // Initialize with 10% to show something is happening
  const [statusMessage, setStatusMessage] = useState('Initializing model generation...');
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Extract jobId and selected image info from location state or fallback
  const jobId = location.state?.jobId || localStorage.getItem('currentJobId');
  
  // Get image URL from various possible locations in the state
  const selectedImageUrl = 
    location.state?.selectedImageUrl || 
    (location.state?.selectedVariationId && location.state?.imageVariations ? 
      location.state.imageVariations.find(v => v.id === location.state.selectedVariationId)?.url : 
      null);
  
  console.log('ModelGenerating - Selected Image URL:', selectedImageUrl);
  console.log('ModelGenerating - Location state:', location.state);
  
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
    
    toast.error('Generation Error', {
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
  
  if (!jobId) {
    toast.error('Error', {
      description: 'No job ID found. Unable to track progress.'
    });
    navigate('/create');
    return null;
  }
  
  // If we don't have an image URL, try to redirect to image selection
  if (!selectedImageUrl && !hasError) {
    console.log('No image selected, redirecting to image selection');
    toast.error('No image selected', {
      description: 'Please select an image for model generation'
    });
    
    // Redirect to image selection if possible
    setTimeout(() => {
      navigate('/select-image', { state: { jobId } });
    }, 1000);
  }
  
  return (
    <>
      {!hasError && (
        <ModelGenerationProcess 
          jobId={jobId}
          selectedImageUrl={selectedImageUrl}
          onStatusUpdate={handleStatusUpdate}
          onError={handleError}
          onPredictionIdSet={handlePredictionIdSet}
        />
      )}
      
      {!hasError && predictionId && (
        <ModelStatusChecker
          jobId={jobId}
          predictionId={predictionId}
          selectedImageUrl={selectedImageUrl}
          hasError={hasError}
          onStatusUpdate={handleStatusUpdate}
          onError={handleError}
        />
      )}
      
      {hasError && errorMessage && (
        <GenerationError 
          error={errorMessage}
          details="The model generation process encountered an error. This could be due to server issues or problems with the input image."
          onRetry={() => window.location.reload()}
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
