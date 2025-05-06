
/**
 * Validation utilities for Supabase Edge Functions
 */

/**
 * Validate if a string is a valid URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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
