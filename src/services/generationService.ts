
import { supabase } from '@/integrations/supabase/client';

// Function to refine an image/model
export const refineModel = async (jobId: string, editInstructions: string) => {
  try {
    // Try to use the Edge Function for refinement
    const { data, error } = await supabase.functions.invoke(
      'refine-image',
      {
        body: { jobId, editInstructions },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to refine image');
    }

    return data;
  } catch (error) {
    console.error('Error refining image:', error);
    throw error;
  }
};

// Function to generate a model from an image
export const generateModel = async (jobId: string, imageUrl: string) => {
  try {
    console.log(`Generating 3D model for job ${jobId} with image: ${imageUrl}`);
    // Use the direct OpenAI integration via Edge Function
    const { data, error } = await supabase.functions.invoke(
      'generate-model',
      {
        body: { jobId, imageUrl },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to generate model');
    }

    console.log('Model generation response:', data);
    return data;
  } catch (error) {
    console.error('Error generating model:', error);
    throw error;
  }
};

// Function to generate images from a prompt
export const generateImages = async (jobId: string, prompt: string, sketch?: string) => {
  try {
    console.log(`Generating images for job ${jobId} with prompt: ${prompt}`);
    // Try to use the Edge Function for image generation
    const { data, error } = await supabase.functions.invoke(
      'generate-images',
      {
        body: { 
          jobId, 
          prompt,
          sketch // Optional base64-encoded sketch
        },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to generate images');
    }

    return data;
  } catch (error) {
    console.error('Error generating images:', error);
    throw error;
  }
};

// Function to add test credits to the user's account
export const addTestCredits = async (userId: string, credits: number = 10) => {
  try {
    // Call the Supabase edge function to add test credits
    const { data, error } = await supabase.functions.invoke(
      'add-test-credits',
      {
        body: { userId, credits },
      }
    );

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to add test credits');
    }

    return data;
  } catch (error) {
    console.error('Error adding test credits:', error);
    throw error;
  }
};
