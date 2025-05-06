
# ModelPixie AI Environment Configuration

This document outlines the environment variables required for the ModelPixie AI application and how to set them up in your Supabase project.

## Setting Up Environment Variables

Since this project uses Supabase Edge Functions, environment variables are managed through Supabase's secure secrets management system. Here's how to set them up:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API > Edge Functions
3. Add each required secret using the interface provided

## Required Environment Variables

### Core Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ENVIRONMENT` | Application environment: 'development', 'staging', or 'production' | No | 'production' |
| `SUPABASE_URL` | Your Supabase project URL | Yes | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes | - |

### N8n Integration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `N8N_MODEL_GENERATION_URL` | Webhook URL for model generation workflow | Yes in prod | Placeholder in dev |
| `N8N_IMAGE_REFINEMENT_URL` | Webhook URL for image refinement workflow | Yes in prod | Placeholder in dev |
| `N8N_JOB_STATUS_URL` | Webhook URL for job status check workflow | Yes in prod | Placeholder in dev |

### Feature Flags

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ENABLE_CACHING` | Enable response caching: 'true' or 'false' | No | 'true' |
| `LOG_LEVEL` | Logging detail level: 'debug', 'info', 'warn', or 'error' | No | 'debug' in dev, 'warn' in prod |

## Security Considerations

- Never commit secrets or credentials to version control
- The service role key has full access to your database, so keep it secure
- Configure environment-specific settings based on the `ENVIRONMENT` variable

## Usage in Edge Functions

Environment variables are accessed through the configuration module:

```typescript
import { getEdgeFunctionConfig } from "../_shared/config.ts";

// Get all configuration
const config = getEdgeFunctionConfig();
console.log(`Running in ${config.environment} mode`);

// Access specific values
const webhookUrl = config.n8nModelGenerationUrl;
```

## Troubleshooting

If edge functions fail with configuration errors:

1. Check that all required secrets are set in the Supabase dashboard
2. Verify that the values match the expected format
3. Check the edge function logs for specific error messages
4. In development mode, missing webhook URLs will use placeholders with warnings
