
# ModelPixie AI Security Configuration

This document outlines the security measures implemented in the ModelPixie AI backend.

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured to allow requests only from trusted domains:

- Production domains: modelpixie.ai and its subdomains
- Staging domains: staging.modelpixie.ai
- Development domains: localhost ports and lovable.dev domains

### CORS Headers

The following CORS headers are applied to all responses:

- `Access-Control-Allow-Origin`: Dynamically set based on the request origin and allowed origins list
- `Access-Control-Allow-Methods`: GET, POST, OPTIONS, PUT, DELETE
- `Access-Control-Allow-Headers`: authorization, x-client-info, apikey, content-type, x-webhook-token
- `Access-Control-Max-Age`: 86400 (24 hours)

## Security Headers

The following security headers are applied to protect against common web vulnerabilities:

- `Content-Security-Policy`: Restricts sources for various resource types
- `X-Content-Type-Options`: Prevents MIME type sniffing
- `X-XSS-Protection`: Enables browser-level XSS protection
- `Referrer-Policy`: Controls what information is sent in the Referer header
- `Permissions-Policy`: Restricts access to browser features

## Rate Limiting

Rate limiting is implemented to prevent abuse:

- General endpoints: 60-120 requests per minute (varies by endpoint)
- Feedback endpoint: 30 requests per minute (stricter)
- Authentication endpoints: 10 requests per minute (strictest)
- N8n webhook callbacks: 180 requests per minute (higher limit for processing callbacks)

Rate limits are enforced based on client IP address. In production, a more persistent solution would be implemented.

### Rate Limit Response

When rate limits are exceeded, endpoints return:

- Status code: 429 Too Many Requests
- JSON error message
- Retry-After header: 60 seconds

## Authentication

Authentication is handled through Supabase Authentication:

- JWTs are validated on protected endpoints
- User IDs are extracted from authentication tokens
- Edge functions verify JWT tokens automatically (configured in config.toml)
- N8n webhooks use a separate token-based authentication mechanism

## N8n Webhook Security

N8n webhook callbacks are authenticated using:

- Secret token authentication via the `x-webhook-token` header
- Rate limiting to prevent abuse
- IP-based filtering (optional configuration)

## Input Validation

All endpoints implement strict input validation:

- UUID validation for IDs
- Range validation for ratings
- Text sanitization for comments
- JSON schema validation for request payloads

## Sanitization

Text inputs are sanitized to prevent injection attacks:

- HTML/script tags are removed
- Text is trimmed
- Length limits are enforced

## Environment-Specific Configuration

Security measures are adjusted based on the environment:

- Development: More permissive CORS, higher rate limits
- Staging: Limited CORS, medium rate limits
- Production: Strict CORS, stricter rate limits, enhanced logging

## Logging and Monitoring

Security events are logged for monitoring and auditing:

- Failed authentication attempts
- Rate limit violations
- Unusual request patterns
- Feedback submissions
- N8n webhook call results

## Configuration

Security settings can be configured through environment variables or the config module.

## Best Practices for Secure Development

When working with ModelPixie AI's backend:

1. Always validate and sanitize user inputs
2. Use parameterized queries for database operations
3. Keep dependencies updated
4. Follow the principle of least privilege
5. Test security measures regularly
