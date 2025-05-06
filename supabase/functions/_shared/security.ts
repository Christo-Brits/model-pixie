
/**
 * Security utilities for ModelPixie AI Edge Functions
 * 
 * This module provides standardized security configurations including:
 * - CORS headers with configurable origins
 * - Security headers for protection against common web vulnerabilities
 * - Rate limiting utilities
 * - Authentication helpers
 */

import { getEnvironment } from "./config.ts";

// Define allowed origins based on environment
export function getAllowedOrigins(): string[] {
  const environment = getEnvironment();
  
  // Base origins that are always allowed
  const origins = [
    "https://modelpixie.ai",
    "https://app.modelpixie.ai",
    "https://www.modelpixie.ai"
  ];
  
  // Add environment-specific origins
  if (environment === 'production') {
    // Only secure origins in production
  } else if (environment === 'staging') {
    origins.push("https://staging.modelpixie.ai");
  } else {
    // Add development origins
    origins.push(
      "http://localhost:8080",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://lovable.dev",
      "https://app.lovable.dev"
    );
  }
  
  return origins;
}

// Standard CORS headers with origin validation
export function getCorsHeaders(requestOrigin?: string): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  
  // Determine the appropriate origin value for the Access-Control-Allow-Origin header
  let originValue = '*';
  
  // If we have a request origin and we're being specific about allowed origins
  if (requestOrigin && allowedOrigins.length > 0) {
    // Only set the specific origin if it's in our allowed list
    originValue = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  }
  
  return {
    'Access-Control-Allow-Origin': originValue,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
  };
}

// Security headers to protect against common web vulnerabilities
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: storage.googleapis.com *.supabase.co; script-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  };
}

// Helper to combine CORS and security headers
export function getAllHeaders(requestOrigin?: string): Record<string, string> {
  return {
    ...getCorsHeaders(requestOrigin),
    ...getSecurityHeaders(),
  };
}

// Simple in-memory rate limiting
// Note: This is basic and will reset when function instances are recycled
// For production, use a more persistent solution
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);
  
  if (!record) {
    ipRequestCounts.set(ip, { count: 1, timestamp: now });
    return true; // First request is allowed
  }
  
  // Reset if outside window
  if (now - record.timestamp > windowMs) {
    ipRequestCounts.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  // Increment and check
  record.count += 1;
  if (record.count > maxRequests) {
    return false; // Rate limit exceeded
  }
  
  return true; // Under limit
}

// Return standardized rate limit exceeded response
export function getRateLimitResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    }),
    {
      status: 429,
      headers: {
        ...getAllHeaders(),
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    }
  );
}

// Extract user ID from authorization header if present
export function extractUserIdFromRequest(req: Request): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    // Extract the JWT token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }
    
    // Simple JWT payload extraction (not full validation)
    // For actual validation, use Supabase Auth or a JWT library
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null; // 'sub' contains the user ID in JWT standard
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

// Helper for handling OPTIONS requests
export function handleOptionsRequest(req: Request): Response {
  const origin = req.headers.get('origin') || '';
  return new Response(null, { 
    status: 204, 
    headers: getAllHeaders(origin)
  });
}
