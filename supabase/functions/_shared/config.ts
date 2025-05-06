
/**
 * Configuration utilities for Supabase Edge Functions
 * 
 * This module provides access to environment variables and configuration settings 
 * for use within Edge Functions. It validates required variables and provides
 * helpful error messages when configuration is incomplete.
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production';

/**
 * Get environment type from ENVIRONMENT variable or default to production
 */
export function getEnvironment(): Environment {
  const env = Deno.env.get('ENVIRONMENT');
  if (env === 'development' || env === 'staging') {
    return env;
  }
  // Default to production for edge functions for safety
  return 'production';
}

/**
 * Check if we're running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Require a configuration value and throw if it's not available
 */
export function requireConfig(key: string): string {
  const value = Deno.env.get(key);
  if (value === undefined || value === '') {
    throw new Error(`Required environment variable ${key} is missing`);
  }
  return value;
}

/**
 * Get a configuration value with a default if not set
 */
export function getConfig(key: string, defaultValue: string): string {
  const value = Deno.env.get(key);
  return value === undefined || value === '' ? defaultValue : value;
}

/**
 * Edge function configuration object that validates required variables
 */
export function getEdgeFunctionConfig() {
  const environment = getEnvironment();
  
  // Required variables will throw if not set
  const supabaseUrl = requireConfig('SUPABASE_URL');
  const supabaseServiceKey = requireConfig('SUPABASE_SERVICE_ROLE_KEY');
  
  // Always have both the webhook URLs - throw if either is missing 
  // in production, but use placeholders in development
  let n8nModelGenerationUrl = Deno.env.get('N8N_MODEL_GENERATION_URL');
  let n8nImageRefinementUrl = Deno.env.get('N8N_IMAGE_REFINEMENT_URL');
  let n8nJobStatusUrl = Deno.env.get('N8N_JOB_STATUS_URL');
  
  // In production, these webhooks are required
  if (environment === 'production') {
    if (!n8nModelGenerationUrl) throw new Error('N8N_MODEL_GENERATION_URL is required in production');
    if (!n8nImageRefinementUrl) throw new Error('N8N_IMAGE_REFINEMENT_URL is required in production');
    if (!n8nJobStatusUrl) throw new Error('N8N_JOB_STATUS_URL is required in production');
  } else {
    // In development, provide placeholder values
    n8nModelGenerationUrl = n8nModelGenerationUrl || 'https://n8n.example.com/webhook/model-generation';
    n8nImageRefinementUrl = n8nImageRefinementUrl || 'https://n8n.example.com/webhook/image-refinement';
    n8nJobStatusUrl = n8nJobStatusUrl || 'https://n8n.example.com/webhook/job-status';
    
    // Log warnings about missing webhook URLs in development
    if (!Deno.env.get('N8N_MODEL_GENERATION_URL')) {
      console.warn('Warning: N8N_MODEL_GENERATION_URL not set, using placeholder');
    }
    if (!Deno.env.get('N8N_IMAGE_REFINEMENT_URL')) {
      console.warn('Warning: N8N_IMAGE_REFINEMENT_URL not set, using placeholder');
    }
    if (!Deno.env.get('N8N_JOB_STATUS_URL')) {
      console.warn('Warning: N8N_JOB_STATUS_URL not set, using placeholder');
    }
  }
  
  return {
    environment,
    isDevelopment: environment === 'development',
    isStaging: environment === 'staging',
    isProduction: environment === 'production',
    
    // Supabase credentials
    supabaseUrl,
    supabaseServiceKey,
    
    // N8n webhook URLs
    n8nModelGenerationUrl,
    n8nImageRefinementUrl,
    n8nJobStatusUrl,
    
    // Feature flags
    enableCaching: getConfig('ENABLE_CACHING', 'true') === 'true',
    logLevel: getConfig('LOG_LEVEL', environment === 'production' ? 'warn' : 'debug') as 'debug' | 'info' | 'warn' | 'error',
  };
}

/**
 * CORS headers for Edge Function responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
