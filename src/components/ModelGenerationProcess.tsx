
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { generateModel } from '@/services/modelGenerationService';
import { updateJobStatus } from '@/services/jobStatusService';
import { supabase } from '@/integrations/supabase/client';

interface ModelGenerationProcessProps {
  jobId: string;
  selectedImageUrl: string | undefined;
  onStatusUpdate: (status: string, progress: number) => void;
  onError: (error: Error) => void;
  onPredictionIdSet: (predictionId: string | null) => void;
}

// Define interfaces to match the expected JSON structure from Supabase
interface ImageVariation {
  id?: number;
  url: string;
  selected?: boolean;
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
          console.error('No job ID provided for model generation');
          throw new Error('Job ID is required for model generation');
        }
        
        // Update UI with initial status
        onStatusUpdate('Checking image availability...', 10);
        console.log(`ModelGenerationProcess - Selected Image URL: ${selectedImageUrl}`);
        
        // If we don't have a selected image URL, try multiple fallback methods
        let imageUrl = selectedImageUrl;
        
        if (!imageUrl) {
          // Try localStorage
          imageUrl = localStorage.getItem('selectedImageUrl');
          console.log(`Retrieved image URL from localStorage: ${imageUrl}`);
        }
        
        if (!imageUrl) {
          // Try to get it from the job's image_url or primary variation
          try {
            const { data } = await supabase
              .from('jobs')
              .select('image_url, image_variations')
              .eq('id', jobId)
              .single();
              
            if (data?.image_url) {
              imageUrl = data.image_url;
              console.log(`Retrieved image URL from job data: ${imageUrl}`);
            } else if (data?.image_variations) {
              // Safely handle potential different types of image_variations
              const variations = data.image_variations as unknown;
              
              // Check if it's an array
              if (Array.isArray(variations) && variations.length > 0) {
                // Find selected variation or use first one
                const selectedVariation = variations.find(
                  (v: any) => v && typeof v === 'object' && v.selected === true
                ) as ImageVariation | undefined;
                
                if (selectedVariation && selectedVariation.url) {
                  imageUrl = selectedVariation.url;
                } else if (variations[0] && typeof variations[0] === 'object' && 'url' in variations[0]) {
                  imageUrl = (variations[0] as ImageVariation).url;
                }
                console.log(`Retrieved image URL from job variations: ${imageUrl}`);
              }
            }
          } catch (error) {
            console.error('Error retrieving job data:', error);
          }
        }
        
        if (!imageUrl) {
          console.error('No image selected for model generation after fallback attempts');
          throw new Error('No image selected for model generation. Please go back and select an image.');
        }
        
        // Store the selected image URL for potential recovery
        localStorage.setItem('selectedImageUrl', imageUrl);
        
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
            
            // Store predictionId in localStorage for potential recovery
            localStorage.setItem('currentPredictionId', predictionId);
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
        } else {
          throw new Error('Invalid response from model generation service');
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
