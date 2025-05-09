
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { generateModel } from '@/services/modelGenerationService';
import { updateJobStatus } from '@/services/jobStatusService';

interface ModelGenerationProcessProps {
  jobId: string;
  selectedImageUrl: string | undefined;
  onStatusUpdate: (status: string, progress: number) => void;
  onError: (error: Error) => void;
  onPredictionIdSet: (predictionId: string | null) => void;
}

export const ModelGenerationProcess: React.FC<ModelGenerationProcessProps> = ({
  jobId,
  selectedImageUrl,
  onStatusUpdate,
  onError,
  onPredictionIdSet
}) => {
  const navigate = useNavigate();
  const [hasInitiated, setHasInitiated] = useState(false);
  
  useEffect(() => {
    // Prevent multiple initiations
    if (hasInitiated) return;

    const startModelGeneration = async () => {
      try {
        // Validate input
        if (!jobId) {
          throw new Error('Job ID is required for model generation');
        }
        
        // Update UI with initial status
        onStatusUpdate('Checking image availability...', 10);
        console.log(`ModelGenerationProcess - Selected Image URL: ${selectedImageUrl}`);
        
        // If we don't have a selected image URL, try to get it from localStorage
        const imageUrl = selectedImageUrl || localStorage.getItem('selectedImageUrl');
        
        if (!imageUrl) {
          console.error('No image selected for model generation');
          throw new Error('No image selected for model generation. Please go back and select an image.');
        }
        
        setHasInitiated(true);
        
        // Send initial status updates
        onStatusUpdate('Starting 3D model generation...', 15);
        
        console.log(`Initiating model generation for job ${jobId} with image: ${imageUrl}`);
        
        // Update job status to processing
        try {
          await updateJobStatus(jobId, 'processing');
        } catch (statusError) {
          console.error('Error updating job status:', statusError);
          // Continue anyway, this is not critical
        }
        
        // Short delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update progress to show activity
        onStatusUpdate('Preparing to generate model...', 20);
        
        // Call the generate model function with the selected image
        const result = await generateModel(jobId, imageUrl);
        
        if (result && result.job) {
          // Get the prediction ID for status checking
          const predictionId = result.job.predictionId || result.job.taskId;
          
          if (predictionId) {
            console.log(`Model generation initiated with prediction ID: ${predictionId}`);
            onPredictionIdSet(predictionId);
            onStatusUpdate(
              `Model generation in progress. Estimated time: ${result.job.estimatedTime || '5-7 minutes'}`,
              25
            );
          } else {
            console.error('No prediction or task ID returned from model generation service');
            throw new Error('Failed to get tracking ID for model generation');
          }
          
          // If the job completed immediately (unlikely but possible)
          if (result.job.status === 'completed' && result.job.modelUrl) {
            onStatusUpdate('Model generation complete!', 100);
            
            toast.success('Model generated successfully!', {
              description: 'Your 3D model is ready to preview.'
            });
            
            navigate('/preview', { 
              state: { 
                jobId,
                modelUrl: result.job.modelUrl,
                imageUrl: imageUrl 
              } 
            });
          }
        }
      } catch (error: any) {
        console.error('Failed to start model generation:', error);
        
        // Provide a more descriptive error message to the user
        let errorMessage = error.message || 'Unknown error occurred during model generation';
        
        // Check if the error is related to missing API keys
        if (errorMessage.includes('MESHY_API_KEY')) {
          errorMessage = 'The server is missing the required API key configuration. Please contact support.';
        }
        
        onError(new Error(errorMessage));
      }
    };
    
    startModelGeneration();
    // We only want to run this effect once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // This is a logic-only component
};
