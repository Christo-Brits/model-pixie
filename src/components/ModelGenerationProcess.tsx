
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
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
  prompt?: string;
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
        onStatusUpdate('Preparing your image for 3D modeling...', 10);
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
        
        // Prepare image with a helpful message about what to expect
        onStatusUpdate('Optimizing image for 3D model generation with Meshy...', 50);
        
        // Short delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set a fake "predictionId" to trigger the UI to show the download button
        onPredictionIdSet("image-ready-for-download");
        
        // Update job status to reflect the new workflow
        try {
          await updateJobStatus(jobId, 'ready_for_download');
        } catch (statusError) {
          console.error('Error updating job status:', statusError);
          // Continue anyway, this is not critical
        }
        
        onStatusUpdate(
          'Your image is ready for use with the Meshy Blender plugin! Download it now to create your 3D model.',
          90
        );
        
      } catch (error: any) {
        console.error('Failed to prepare image for download:', error);
        
        // Provide a more descriptive error message to the user
        let errorMessage = error.message || 'Unknown error occurred during image preparation';
        
        onError(new Error(errorMessage));
      }
    };
    
    startModelGeneration();
    // We only want to run this effect once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // This is a logic-only component
};
