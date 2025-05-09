import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { checkModelGenerationStatus } from '@/services/modelGenerationService';

interface ModelStatusCheckerProps {
  jobId: string;
  predictionId: string;
  selectedImageUrl: string;
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
  const [checkAttempts, setCheckAttempts] = useState(0);
  
  // Function to handle image download for Blender plugin
  const downloadImageForBlender = useCallback(() => {
    if (selectedImageUrl) {
      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = selectedImageUrl;
      link.download = `model-image-${jobId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Image downloaded successfully', {
        description: 'Use this image with the Meshy Blender plugin to create your 3D model.'
      });
      
      // Navigate to a success screen or instructions page
      navigate('/preview', { 
        state: { 
          jobId,
          imageUrl: selectedImageUrl,
          downloadComplete: true,
          usingBlenderWorkflow: true
        } 
      });
    }
  }, [selectedImageUrl, jobId, navigate]);
  
  // Special case for our new workflow (image ready for download)
  useEffect(() => {
    // Check if we're in the image download workflow 
    if (predictionId === "image-ready-for-download" && !hasError) {
      // Update UI to show download button
      onStatusUpdate(
        'Image ready for use with Meshy Blender plugin. Use the download button to save the image.',
        95
      );
      
      // We would normally provide a download button in the UI
      // For simplicity we're triggering this automatically after a short delay
      // In a real app, you might want to have this as a button in the UI instead
      setTimeout(() => {
        downloadImageForBlender();
      }, 3000);
      
      return;
    }
    
    // The rest of this effect is for future direct API integration
    // It will be skipped in our current workflow
    
    let intervalId: number | null = null;
    
    if (predictionId && !hasError) {
      intervalId = setInterval(async () => {
        setCheckAttempts(prevAttempts => prevAttempts + 1);
        
        console.log(`Checking model generation status (attempt ${checkAttempts + 1})`);
        onStatusUpdate('Checking model generation status...', -1);
        
        try {
          const status = await checkModelGenerationStatus(jobId);
          
          if (status.status === 'completed') {
            console.log('Model generation complete!');
            onStatusUpdate('Model generation complete!', 100);
            
            toast.success('Model generated successfully!', {
              description: 'Your 3D model is ready to preview.'
            });
            
            clearInterval(intervalId!);
            
            navigate('/preview', { 
              state: { 
                jobId,
                modelUrl: status.modelUrl,
                imageUrl: selectedImageUrl 
              } 
            });
          } else if (status.status === 'processing') {
            console.log('Model generation is still processing...');
            onStatusUpdate(`Model generation in progress. Estimated time remaining: ${status.estimatedTimeRemaining || '5-7 minutes'}`, -1);
          } else if (status.status === 'failed' || status.status === 'error') {
            console.error('Model generation failed:', status.error);
            clearInterval(intervalId!);
            onError(new Error(status.error || 'Model generation failed'));
          } else {
            console.log(`Model generation status: ${status.status}`);
            onStatusUpdate(`Model generation status: ${status.status}`, -1);
          }
        } catch (error: any) {
          console.error('Error checking model generation status:', error);
          clearInterval(intervalId!);
          onError(error);
        }
      }, 15000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [predictionId, hasError, jobId, checkAttempts, onStatusUpdate, onError, navigate, downloadImageForBlender, selectedImageUrl]);
  
  return null; // This component doesn't render anything
};
