
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if request method is POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { jobId, rating, comment } = await req.json();

    // Validate required fields
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid jobId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate rating
    if (rating === undefined) {
      return new Response(
        JSON.stringify({ error: 'Rating is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure rating is a number between 1 and 5
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be a number between 1 and 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize comment (if provided)
    let sanitizedComment = null;
    if (comment !== undefined) {
      // Basic sanitization - trim and limit length
      sanitizedComment = String(comment).trim().substring(0, 1000);
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify jobId exists in the jobs table
    const { data: jobData, error: jobError } = await supabaseClient
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError) {
      console.error("Error verifying job:", jobError);
      return new Response(
        JSON.stringify({ error: 'Database error occurred while verifying job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobData) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing feedback on this job to prevent duplicates
    const { data: existingFeedback, error: checkError } = await supabaseClient
      .from('feedback')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing feedback:", checkError);
      return new Response(
        JSON.stringify({ error: 'Database error occurred while checking existing feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingFeedback) {
      // If feedback already exists, update it instead
      const { error: updateError } = await supabaseClient
        .from('feedback')
        .update({ 
          rating: numericRating,
          comment: sanitizedComment 
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        console.error("Error updating feedback:", updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update feedback' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Feedback updated successfully',
          updated: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new feedback
    const { error: insertError } = await supabaseClient
      .from('feedback')
      .insert({
        job_id: jobId,
        rating: numericRating,
        comment: sanitizedComment
      });

    if (insertError) {
      console.error("Error inserting feedback:", insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Feedback submitted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
