/**
 * Security helpers for Supabase Edge Functions
 * 
 * This module provides rate limiting, CORS, and other security utilities
 */

// Store rate limit data in memory (will reset when edge function cold starts)
// For production, consider using a persistent KV store or Redis
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

// Default CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

/**
 * Handle OPTIONS requests with appropriate CORS headers
 */
export function handleOptionsRequest(req: Request): Response {
  // Get the requesting origin
  const origin = req.headers.get('origin') || '*';
  
  // Create custom CORS headers for this specific origin
  const headers = getAllHeaders(origin);

  // Return a response with appropriate headers for the OPTIONS request
  return new Response(null, { headers });
}

/**
 * Get all CORS headers for a specific origin
 */
export function getAllHeaders(origin: string): HeadersInit {
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': origin,
  };
}

/**
 * Check if a client has exceeded rate limits
 * 
 * @param clientIdentifier IP address or other identifier
 * @param limit Maximum requests per minute
 * @returns boolean indicating if the request should be allowed
 */
export function checkRateLimit(clientIdentifier: string, limit: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  // Get or initialize rate limit data for this client
  const data = rateLimitStore.get(clientIdentifier) || { count: 0, timestamp: now };
  
  // Reset if outside the current window
  if (now - data.timestamp > windowMs) {
    data.count = 0;
    data.timestamp = now;
  }
  
  // Increment request count
  data.count++;
  
  // Update the store
  rateLimitStore.set(clientIdentifier, data);
  
  // Allow the request if under the limit
  return data.count <= limit;
}

/**
 * Return a standardized rate limit exceeded response
 */
export function getRateLimitResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );
}

/**
 * Validate a JWT token from Supabase Auth
 * This is a simple implementation; for production use a more robust JWT validation
 */
export async function validateJWT(authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  // In a real implementation, you would validate the JWT signature and claims
  // This is a placeholder for demonstration
  return true;
}
