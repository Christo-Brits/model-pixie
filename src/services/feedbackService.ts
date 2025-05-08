
import { supabase } from '@/integrations/supabase/client';

// Function to save feedback for a job
export const saveFeedback = async (jobId: string, rating: number, comment?: string) => {
  try {
    // Try to use the Edge Function for feedback submission
    const { data, error } = await supabase.functions.invoke(
      'feedback',
      {
        body: { jobId, rating, comment },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to submit feedback');
    }

    return data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // Fallback: Direct database insert
    const { error: dbError } = await supabase
      .from('feedback')
      .insert({
        job_id: jobId,
        rating,
        comment
      });
      
    if (dbError) throw dbError;
    return true;
  }
};

// Helper function to select an image variation for model generation
export const selectImageVariation = async (jobId: string, variationId: number) => {
  try {
    // First fetch the current job to get all variations
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('image_variations, image_url')
      .eq('id', jobId)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (!job || !job.image_variations) {
      throw new Error('No image variations found for this job');
    }
    
    // Find the selected variation
    const variations = job.image_variations as any[];
    const selectedVariation = variations.find(v => v.id === variationId);
    
    if (!selectedVariation) {
      throw new Error(`Image variation with id ${variationId} not found`);
    }
    
    // Update the variations to mark the selected one
    const updatedVariations = variations.map(v => ({
      ...v,
      selected: v.id === variationId
    }));
    
    // Update the job record with the selected variation
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        image_variations: updatedVariations,
        image_url: selectedVariation.url // Set as primary image
      })
      .eq('id', jobId);
      
    if (updateError) throw updateError;
    
    return selectedVariation;
  } catch (error) {
    console.error('Error selecting image variation:', error);
    throw error;
  }
};
