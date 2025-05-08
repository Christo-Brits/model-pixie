/**
 * Shared validation functions for Supabase Edge Functions
 * 
 * This module provides validation utilities used across multiple edge functions
 */

/**
 * Validates a URL string
 * @param urlString URL to validate
 * @returns boolean indicating if the URL is valid
 */
export function isValidURL(urlString: string): boolean {
  try {
    // Check if the string is a data URL
    if (urlString.startsWith('data:')) {
      return true;
    }
    
    // Otherwise, check if it's a valid URL
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Validates a UUID string
 * @param uuid UUID string to validate
 * @returns boolean indicating if the UUID is valid
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if base64 string is valid
 * @param str Base64 string to validate
 * @returns boolean indicating if the string is valid base64
 */
export function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

/**
 * Sanitize text input to prevent injection attacks
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Remove HTML/script tags and trim
  return text
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 2000); // Limit length
}

/**
 * Validate if a number is within a specified range
 */
export function isNumberInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
