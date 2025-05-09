
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { generateModel } from '@/services/generationService';
import { GenerationError } from '@/components/create/GenerationError';

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
        // If we have a selected image URL from the image selection page
        if (selectedImageUrl) {
          setHasInitiated(true);
          onStatusUpdate('Starting 3D model generation...', 10);
          
          console.log(`Initiating model generation for job ${jobId} with image: ${selectedImageUrl}`);
          
          // Call the generate model function with the selected image
          const result = await generateModel(jobId, selectedImageUrl);
          
          if (result && result.job) {
            // Get the prediction ID for status checking
            const predictionId = result.job.predictionId || result.job.taskId;
            
            if (predictionId) {
              console.log(`Model generation initiated with prediction ID: ${predictionId}`);
              onPredictionIdSet(predictionId);
              onStatusUpdate(
                `Model generation in progress. Estimated time: ${result.job.estimatedTime || '5-7 minutes'}`,
                20
              );
            } else {
              console.error('No prediction or task ID returned from model generation service');
              throw new Error('Failed to get tracking ID for model generation');
            }
            
            // If the job completed immediately (unlikely but possible)
            if (result.job.status === 'completed' && result.job.modelUrl) {
              onStatusUpdate('Model generation complete!', 100);
              
              toast('Model generated successfully!', {
                description: 'Your 3D model is ready to preview.'
              });
              
              navigate('/preview', { 
                state: { 
                  jobId,
                  modelUrl: result.job.modelUrl,
                  imageUrl: selectedImageUrl 
                } 
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Failed to start model generation:', error);
        onError(error);
      }
    };
    
    startModelGeneration();
    // We only want to run this effect once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // This is a logic-only component
};
