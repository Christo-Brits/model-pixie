
/**
 * Central configuration module for ModelPixie AI
 * 
 * This module provides access to environment variables and configuration settings
 * used throughout the application. It's designed to work with Supabase Edge Functions
 * and the Supabase secrets management system.
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Define interface for strong typing of configuration
export interface AppConfig {
  // Environment
  environment: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // N8n Webhooks
  n8nModelGenerationUrl: string;
  n8nImageRefinementUrl: string;
  n8nJobStatusUrl: string;
  
  // Feature flags
  enableCaching: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Returns application configuration for client-side code.
 * Only includes publicly safe values.
 */
export const getClientConfig = (): Partial<AppConfig> => {
  return {
    environment: getEnvironment(),
    isDevelopment: getEnvironment() === 'development',
    isStaging: getEnvironment() === 'staging',
    isProduction: getEnvironment() === 'production',
    supabaseUrl: "https://pvtrmpaxhbvhvdiojqkd.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHJtcGF4aGJ2aHZkaW9qcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjk2NTksImV4cCI6MjA2MTkwNTY1OX0.TpnUr4VDUWVRNEQNLHMp5nkeRBLRSsTjWpvWKHZNG8w",
    logLevel: getEnvironment() === 'production' ? 'warn' : 'debug',
  };
};

/**
 * Helper function to determine the current environment
 */
export const getEnvironment = (): Environment => {
  // In a browser, determine environment based on URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('.local')) {
      return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    }
    return 'production';
  }
  
  // In Edge Functions or other server environments, use environment variables
  // Since we can't directly access Deno in browser context, we need to handle this differently
  if (typeof process !== 'undefined' && process.env) {
    const env = process.env.ENVIRONMENT;
    if (env === 'development' || env === 'staging') {
      return env as Environment;
    }
    return 'production'; // Default to production for safety
  }
  
  // Default
  return 'development';
};

/**
 * Validates if a configuration value is present and throws an error if it's not
 */
export const requireConfig = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Required environment variable ${name} is missing`);
  }
  return value;
};
