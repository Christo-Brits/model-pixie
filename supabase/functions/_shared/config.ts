
/**
 * Shared configuration module for Supabase Edge Functions
 * 
 * This module provides centralized configuration access and validation
 * for all edge functions in the ModelPixie AI backend.
 */

// Define interface for configuration object
interface EdgeFunctionConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  n8nModelGenerationUrl: string;
  n8nImageRefinementUrl: string;
  n8nWebhookSecretToken?: string;
  environment: string;
  corsAllowedOrigins: string[];
  apiRateLimit: number;
  isProd: boolean;
}

// CORS headers that will be used by all edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

/**
 * Load and validate environment configuration
 * This function ensures all required environment variables are present
 */
export function getEdgeFunctionConfig(): EdgeFunctionConfig {
  // Required configuration values
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  
  // Optional configuration values with defaults
  const n8nModelGenerationUrl = Deno.env.get('N8N_MODEL_GENERATION_URL') || 'https://n8n.modelpixie.ai/webhook/modelpixie-model-generation';
  const n8nImageRefinementUrl = Deno.env.get('N8N_IMAGE_REFINEMENT_URL') || 'https://n8n.modelpixie.ai/webhook/modelpixie-image-refinement';
  const n8nWebhookSecretToken = Deno.env.get('N8N_WEBHOOK_SECRET_TOKEN');
  
  // Environment configuration
  const environment = Deno.env.get('ENVIRONMENT') || 'development';
  const isProd = environment === 'production';
  
  // CORS configuration
  const corsOrigins = Deno.env.get('CORS_ALLOWED_ORIGINS') || '';
  const defaultOrigins = isProd 
    ? ['https://modelpixie.ai', 'https://app.modelpixie.ai'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'https://lovable.dev'];
    
  const corsAllowedOrigins = corsOrigins 
    ? [...corsOrigins.split(','), ...defaultOrigins]
    : defaultOrigins;
    
  // Rate limiting configuration
  const apiRateLimit = parseInt(Deno.env.get('API_RATE_LIMIT') || (isProd ? '60' : '300'));

  return {
    supabaseUrl,
    supabaseServiceKey,
    n8nModelGenerationUrl,
    n8nImageRefinementUrl,
    n8nWebhookSecretToken,
    environment,
    corsAllowedOrigins,
    apiRateLimit,
    isProd
  };
}

/**
 * Helper function to require an environment variable
 * Throws an error if the variable is not set
 */
function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}
