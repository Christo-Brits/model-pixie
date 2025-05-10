
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/config.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    // Input validation
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Enhancing prompt: ${prompt}`);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI API to enhance the prompt - using gpt-4o-mini for better prompt enhancement
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Upgraded from gpt-3.5-turbo for better quality
        messages: [
          {
            role: "system",
            content: "You are a specialized prompt engineer for GPT-Image-1, OpenAI's advanced image generation model. Your job is to enhance basic prompts into detailed instructions for generating high-quality, 3D-printable model concepts. Focus on providing explicit details about the object's form, texture, lighting, perspective, and style that would work well for both GPT-Image-1 rendering and eventual 3D modeling. The enhanced prompt should preserve the core concept while adding specific visual characteristics that will result in consistent, detailed, and practical 3D model designs."
          },
          {
            role: "user",
            content: `Enhance this prompt for GPT-Image-1 image generation (which will be used as reference for 3D modeling): "${prompt}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 400 // Increased token limit for more detailed prompts
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`OpenAI API error: ${openAIResponse.status}`, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to enhance prompt', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await openAIResponse.json();
    const enhancedPrompt = responseData.choices[0].message.content.trim();
    
    console.log(`Enhanced prompt: ${enhancedPrompt}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        originalPrompt: prompt,
        enhancedPrompt: enhancedPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in enhance-prompt function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
