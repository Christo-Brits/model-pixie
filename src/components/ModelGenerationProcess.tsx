
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { generateModel } from '@/services/generationService';

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
  
  useEffect(() => {
    const startModelGeneration = async () => {
      try {
        // If we have a selected image URL from the image selection page
        if (selectedImageUrl) {
          onStatusUpdate('Starting 3D model generation...', 10);
          
          // Call the generate model function with the selected image
          const result = await generateModel(jobId, selectedImageUrl);
          
          if (result && result.job) {
            // Set prediction ID for status checking
            // We can get the ID from either predictionId or taskId
            const predictionId = result.job.predictionId || result.job.taskId;
            
            if (predictionId) {
              onPredictionIdSet(predictionId);
              onStatusUpdate(
                `Model generation in progress. Estimated time: ${result.job.estimatedTime || '5-7 minutes'}`,
                20
              );
              
              // Log the ID we're using
              console.log(`Model generation started with ID: ${predictionId}`);
            } else {
              console.error('No prediction or task ID returned from model generation service');
              throw new Error('Failed to get tracking ID for model generation');
            }
            
            // If the job completed immediately (unlikely but possible)
            if (result.job.status === 'completed' && result.job.modelUrl) {
              onStatusUpdate('Model generation complete!', 100);
              
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
        onError(error);
      }
    };
    
    startModelGeneration();
    // We only want to run this effect once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // This is a logic-only component
};
