
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
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
            if (result.job.predictionId) {
              onPredictionIdSet(result.job.predictionId);
              onStatusUpdate(
                `Model generation in progress. Estimated time: ${result.job.estimatedTime || '5-7 minutes'}`,
                20
              );
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
