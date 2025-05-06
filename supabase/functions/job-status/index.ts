
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { 
  handleOptionsRequest, 
  getAllHeaders,
  checkRateLimit,
  getRateLimitResponse
} from "../_shared/security.ts";

serve(async (req) => {
  // Get the client IP for rate limiting
  // In Supabase Edge Functions, this might come from CF-Connecting-IP
  const clientIP = req.headers.get('CF-Connecting-IP') || 
                   req.headers.get('X-Forwarded-For')?.split(',')[0] ||
                   '127.0.0.1';
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest(req);
  }

  // Apply rate limiting
  if (!checkRateLimit(clientIP, 120)) { // 120 requests per minute
    return getRateLimitResponse();
  }

  try {
    // Check if request method is GET
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...getAllHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' } }
      );
    }

    // Parse URL to get jobId parameter
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 1];
    
    // Validate jobId format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!jobId || !uuidRegex.test(jobId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid job ID format' }),
        { status: 400, headers: { ...getAllHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Query job status - optimized to select only needed fields
    const { data: jobData, error: dbError } = await supabaseClient
      .from('jobs')
      .select('status, image_url, model_url, iterations')
      .eq('id', jobId)
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      
      // Check if error is related to not finding the record
      if (dbError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...getAllHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Database error occurred' }),
        { status: 500, headers: { ...getAllHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' } }
      );
    }

    if (!jobData) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...getAllHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' } }
      );
    }

    // Return job status data
    return new Response(
      JSON.stringify({
        status: jobData.status || 'unknown',
        imageUrl: jobData.image_url,
        modelUrl: jobData.model_url,
        iterations: jobData.iterations || 0
      }),
      { 
        status: 200, 
        headers: { 
          ...getAllHeaders(req.headers.get('origin') || ''), 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate' // Prevent caching for real-time status
        } 
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getAllHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' } }
    );
  }
});
