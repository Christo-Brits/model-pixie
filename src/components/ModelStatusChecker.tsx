import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { checkModelGenerationStatus } from '@/services/generationService';

interface ModelStatusCheckerProps {
  jobId: string;
  predictionId: string | null;
  selectedImageUrl: string | undefined;
  hasError: boolean;
  onStatusUpdate: (status: string, progress: number) => void;
  onError: (error: Error) => void;
}

export const ModelStatusChecker: React.FC<ModelStatusCheckerProps> = ({
  jobId,
  predictionId,
  selectedImageUrl,
  hasError,
  onStatusUpdate,
  onError
}) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (hasError) return;
    
    let pollingInterval: number | null = null;
    let visualProgressInterval: number | null = null;
    
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
          onStatusUpdate(`Processing model. ${status.estimatedTimeRemaining || 'Please wait...'}`, progressValue);
        } else if (status.status === 'succeeded' || status.status === 'completed') {
          onStatusUpdate('Model generation complete!', 100);
          
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
          onError(new Error(status.error || 'There was a problem generating your model.'));
          
          // Clear polling interval
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
        }
      } catch (error: any) {
        console.error('Error checking model status:', error);
        // Don't clear interval on error, just keep trying
      }
    };
    
    // Check status immediately
    checkModelStatus();
      
    // Then poll every 10 seconds
    pollingInterval = window.setInterval(checkModelStatus, 10000);
    
    // Set up progressive visual progress indicators
    visualProgressInterval = window.setInterval(() => {
      if (!hasError) {
        onStatusUpdate('', -1); // Signal to increment progress
      }
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
  }, [jobId, predictionId, selectedImageUrl, hasError]);

  return null; // This is a logic-only component
};
