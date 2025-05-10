
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders } from "../_shared/config.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { prompt, jobId, userId, sketch, quality = "high", background = "opaque", seed } = await req.json();
    
    // Input validation
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update job status to 'generating'
    await supabase
      .from('jobs')
      .update({ status: 'generating' })
      .eq('id', jobId);
      
    console.log(`Job ${jobId} status updated to 'generating'. Generating images for prompt: ${prompt}`);
    
    // First, try to enhance the prompt
    console.log("Calling enhance-prompt function...");
    let enhancedPrompt = prompt;
    
    try {
      const enhanceResponse = await fetch(`${supabaseUrl}/functions/v1/enhance-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ prompt })
      });
      
      if (enhanceResponse.ok) {
        const enhanceData = await enhanceResponse.json();
        if (enhanceData.enhancedPrompt) {
          enhancedPrompt = enhanceData.enhancedPrompt;
          console.log(`Using enhanced prompt: ${enhancedPrompt}`);
        }
      } else {
        console.error("Failed to enhance prompt, using original prompt instead");
      }
    } catch (enhanceError) {
      console.error("Error enhancing prompt:", enhanceError);
      console.log("Continuing with original prompt");
    }
    
    // Prepare OpenAI API request using gpt-image-1 model (new model)
    let openAIPayload: any = {
      model: "gpt-image-1", // Using the new GPT-Image-1 model
      prompt: enhancedPrompt,
      n: 1,  // GPT-Image-1 supports multiple images per request
      size: "1024x1024",
      quality: quality, // New parameter: can be "low", "medium", or "high"
      response_format: "url"
    };
    
    // Add optional parameters if provided
    if (background === "transparent") {
      openAIPayload.background = "transparent";
    }
    
    if (seed !== undefined) {
      openAIPayload.seed = seed;
    }
    
    // Log the API request
    console.log("Sending request to OpenAI with payload:", JSON.stringify(openAIPayload));
    
    // Call OpenAI API to generate images
    console.log("Calling OpenAI API to generate images...");
    const openAIResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify(openAIPayload)
    });
    
    console.log(`OpenAI API response status: ${openAIResponse.status}`);
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error("OpenAI API error:", errorData);
      await supabase
        .from('jobs')
        .update({ status: 'error', error_message: errorData })
        .eq('id', jobId);
        
      return new Response(
        JSON.stringify({ error: 'Image generation failed', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const imageData = await openAIResponse.json();
    console.log("Images generated successfully");
    
    // Make up to 3 more calls to get 4 variations total
    // Each with slightly modified prompts to get different results
    const additionalImages = [];
    const promptModifiers = [
      "alternative perspective of ",
      "different style of ",
      "creative variation of "
    ];
    
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Generating additional image ${i+1}...`);
        
        // Modify the prompt slightly for each variation
        const modifiedPrompt = `${promptModifiers[i]}${enhancedPrompt}`;
        
        const additionalResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
          },
          body: JSON.stringify({
            ...openAIPayload,
            prompt: modifiedPrompt
          })
        });
        
        if (additionalResponse.ok) {
          const additionalData = await additionalResponse.json();
          if (additionalData.data && additionalData.data.length > 0) {
            additionalImages.push(additionalData.data[0]);
            console.log(`Additional image ${i+1} generated successfully`);
          }
        } else {
          console.error(`Failed to generate additional image ${i+1}:`, await additionalResponse.text());
        }
      } catch (err) {
        console.error(`Error generating additional image ${i+1}:`, err);
        // Continue with other images if one fails
      }
    }
    
    // Combine all images
    const allImages = [...imageData.data, ...additionalImages];
    
    // Upload each image to Supabase Storage
    const imageUrls = [];
    const imageVariations = [];
    
    for (let i = 0; i < allImages.length; i++) {
      const imageUrl = allImages[i].url;
      
      // Fetch image data
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `job_${jobId}_variation_${i+1}_${timestamp}.png`;
      const filePath = `${jobId}/${filename}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('concept-images')
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });
        
      if (uploadError) {
        console.error(`Error uploading image ${i+1}:`, uploadError);
        continue;
      }
      
      // Get public URL for the uploaded image
      const { data: publicUrlData } = supabase
        .storage
        .from('concept-images')
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      
      imageUrls.push(publicUrl);
      imageVariations.push({
        id: i + 1,
        url: publicUrl,
        selected: false,
        prompt: i === 0 ? enhancedPrompt : `${promptModifiers[i-1]}${enhancedPrompt}` // Store the prompt with each variation
      });
    }
    
    // Update job with image URLs, enhanced prompt, and set status to 'images_ready'
    if (imageUrls.length > 0) {
      const firstImageUrl = imageUrls[0];
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          status: 'images_ready',
          image_url: firstImageUrl,  // Store first image as primary
          image_variations: imageVariations,  // Store all variations as JSON
          enhanced_prompt: enhancedPrompt,    // Store the enhanced prompt
          original_prompt: prompt              // Store the original prompt
        })
        .eq('id', jobId);
        
      if (updateError) {
        console.error("Error updating job with image URLs:", updateError);
        
        return new Response(
          JSON.stringify({ error: 'Failed to update job with image URLs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      await supabase
        .from('jobs')
        .update({ status: 'error', error_message: 'No images were successfully uploaded' })
        .eq('id', jobId);
        
      return new Response(
        JSON.stringify({ error: 'No images were successfully uploaded' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Images generated successfully',
        images: imageUrls,
        enhancedPrompt: enhancedPrompt,
        job: {
          id: jobId,
          status: 'images_ready'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in generate-images function:", error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
