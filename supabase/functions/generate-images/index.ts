
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
    const { prompt, jobId, userId, sketch } = await req.json();
    
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
    
    // Prepare OpenAI API request using latest model
    let openAIPayload = {
      model: "gpt-4.1-vision", // Using the newer vision model (Note: Replace with actual model name if different)
      prompt: prompt,
      n: 4,  // Generate 4 variations
      size: "1024x1024",
      quality: "standard",
      response_format: "url"
    };
    
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
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error("OpenAI API error:", errorData);
      await supabase
        .from('jobs')
        .update({ status: 'error' })
        .eq('id', jobId);
        
      return new Response(
        JSON.stringify({ error: 'Image generation failed', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const imageData = await openAIResponse.json();
    console.log("Images generated successfully");
    
    // Upload each image to Supabase Storage
    const imageUrls = [];
    const imageVariations = [];
    
    for (let i = 0; i < imageData.data.length; i++) {
      const imageUrl = imageData.data[i].url;
      
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
        selected: false
      });
    }
    
    // Update job with image URLs and set status to 'images_ready'
    if (imageUrls.length > 0) {
      const firstImageUrl = imageUrls[0];
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          status: 'images_ready',
          image_url: firstImageUrl,  // Store first image as primary
          image_variations: imageVariations,  // Store all variations as JSON
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
        .update({ status: 'error' })
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
