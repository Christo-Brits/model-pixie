import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModelGenerationLoading } from '@/components/ModelGenerationLoading';
import { toast } from '@/hooks/use-toast';
import { pollJobStatus, getStatusDescription, updateJobStatus } from '@/services/jobStatusService';
import { generateModel, checkModelGenerationStatus } from '@/services/generationService';
import { supabase } from '@/integrations/supabase/client';

const ModelGenerating = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Starting process...');
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Extract jobId and selected image info from location state or fallback
  const jobId = location.state?.jobId || localStorage.getItem('currentJobId');
  const selectedImageUrl = location.state?.selectedImageUrl;
  
  useEffect(() => {
    if (!jobId) {
      toast({
        title: 'Error',
        description: 'No job ID found. Unable to track progress.',
        variant: 'destructive'
      });
      navigate('/create');
      return;
    }
    
    // Store jobId in localStorage as a fallback
    localStorage.setItem('currentJobId', jobId);
    
    const startModelGeneration = async () => {
      try {
        setIsProcessing(true);
        // If we have a selected image URL from the image selection page
        if (selectedImageUrl) {
          setStatusMessage('Starting 3D model generation...');
          
          // Call the generate model function with the selected image
          const result = await generateModel(jobId, selectedImageUrl);
          
          if (result && result.job) {
            // Set prediction ID for status checking
            if (result.job.predictionId) {
              setPredictionId(result.job.predictionId);
              setStatusMessage(`Model generation in progress. Estimated time: ${result.job.estimatedTime}`);
            }
            
            // If the job completed immediately (unlikely but possible)
            if (result.job.status === 'completed' && result.job.modelUrl) {
              setProgress(100);
              toast({
                title: 'Model generated successfully!',
                description: 'Your 3D model is ready to preview.',
              });
              
              navigate('/preview', { 
                state: { 
                  jobId,
                  modelUrl: result.job.modelUrl,
                  imageUrl: selectedImageUrl 
                } 
              });
              return;
            }
          }
        }
      } catch (error: any) {
        console.error('Failed to start model generation:', error);
        setHasError(true);
        setStatusMessage(`Generation error: ${error.message || 'Unknown error'}`);
        toast({
          title: 'Generation Error',
          description: error.message || 'Failed to start model generation. The Replicate API key may not be configured.',
          variant: 'destructive'
        });
        
        // Update job status to error
        try {
          await updateJobStatus(jobId, 'error');
        } catch (statusError) {
          console.error('Failed to update job status:', statusError);
        }
      } finally {
        setIsProcessing(false);
      }
    };
    
    startModelGeneration();
    
    // Initialize progress indicator and set up polling for model status
    let pollingInterval: number | null = null;
    
    const checkModelStatus = async () => {
      try {
        // Skip status check if there's already an error
        if (hasError) return;
        
        // Use job status polling if no prediction ID is available
        if (!predictionId) {
          return;
        }
        
        // Check status using the prediction ID
        const status = await checkModelGenerationStatus(jobId);
        
        // Update status message and progress
        if (status.status === 'processing' || status.status === 'starting') {
          const progressValue = status.progress ? Math.round(status.progress * 100) : 
                               status.status === 'processing' ? 50 : 20;
          setProgress(progressValue);
          setStatusMessage(`Processing model. ${status.estimatedTimeRemaining || 'Please wait...'}`);
        } else if (status.status === 'succeeded' || status.status === 'completed') {
          setProgress(100);
          setStatusMessage('Model generation complete!');
          
          // Navigate to preview page
          toast({
            title: 'Model generated successfully!',
            description: 'Your 3D model is ready to preview.',
          });
          
          navigate('/preview', { 
            state: { 
              jobId,
              modelUrl: status.modelUrl,
              imageUrl: selectedImageUrl 
            } 
          });
          
          // Clear polling interval
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
        } else if (status.status === 'failed' || status.status === 'error') {
          setHasError(true);
          setStatusMessage('Generation failed. Please try again.');
          toast({
            title: 'Generation failed',
            description: status.error || 'There was a problem generating your model. Please try again.',
            variant: 'destructive'
          });
          
          // Clear polling interval
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
        }
      } catch (error) {
        console.error('Error checking model status:', error);
        // Don't clear interval on error, just keep trying
      }
    };
    
    // Only start polling if we don't have an error
    if (!hasError) {
      // Check status immediately
      checkModelStatus();
      
      // Then poll every 10 seconds
      pollingInterval = window.setInterval(checkModelStatus, 10000);
    }
    
    // Set up progressive visual progress indicators
    const visualProgressInterval = window.setInterval(() => {
      setProgress(prevProgress => {
        // Only auto-increment progress if we're below 95% and we don't have an error
        if (!hasError && prevProgress < 95) {
          return prevProgress + 1;
        }
        return prevProgress;
      });
    }, 5000);
    
    // Cleanup function
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (visualProgressInterval) {
        clearInterval(visualProgressInterval);
      }
    };
  }, [navigate, jobId, selectedImageUrl, predictionId, hasError]);
  
  const handleCancel = async () => {
    try {
      // Update job status to cancelled
      await updateJobStatus(jobId, 'cancelled');
      
      toast({
        title: 'Generation cancelled',
        description: 'Your credit has been returned to your account.',
      });
      navigate('/create');
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };
  
  return (
    <ModelGenerationLoading 
      progress={progress} 
      estimatedTime={progress < 80 ? "5-7 min" : "Almost done"}
      creditUsage={1}
      onCancel={handleCancel}
      statusMessage={hasError ? statusMessage : statusMessage}
    />
  );
};

export default ModelGenerating;
