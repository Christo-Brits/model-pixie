
# ModelPixie AI N8n Webhook Integration

This document outlines the integration between ModelPixie AI and n8n workflows through webhooks.

## Webhook Flow

1. ModelPixie AI triggers n8n workflows for tasks like image generation and model creation
2. N8n performs the requested operations using AI services
3. N8n sends callbacks to the ModelPixie AI backend to update job status
4. ModelPixie AI updates the database and makes results available to users

## Callback Endpoint

The ModelPixie AI backend exposes an edge function to receive callbacks from n8n:

```
https://pvtrmpaxhbvhvdiojqkd.supabase.co/functions/v1/n8n-callback
```

## Authentication

N8n should include the `x-webhook-token` header with the secret token configured in the EdgeFunction's environment variables.

## Payload Formats

### Model Generation Completion

```json
{
  "operation": "model_generation_complete",
  "jobId": "uuid-of-the-job",
  "modelUrl": "https://storage.example.com/model.glb",
  "status": "completed",
  "message": "Model generation successfully completed",
  "iterations": 1
}
```

### Image Refinement Completion

```json
{
  "operation": "image_refinement_complete",
  "jobId": "uuid-of-the-job",
  "imageUrl": "https://storage.example.com/refined-image.png",
  "status": "refined",
  "message": "Image refinement successfully completed",
  "iterations": 2
}
```

### Status Update

```json
{
  "operation": "status_update",
  "jobId": "uuid-of-the-job",
  "status": "processing",
  "message": "Processing step 2 of 4: Mesh generation",
  "progress": 50
}
```

### Error Notification

```json
{
  "operation": "error",
  "jobId": "uuid-of-the-job",
  "errorMessage": "Failed to generate model due to invalid input",
  "errorCode": "MODEL_GEN_FAILURE",
  "errorStep": "mesh_creation"
}
```

## Response Format

The endpoint will respond with a JSON object containing:

```json
{
  "success": true,
  "message": "Operation processed successfully",
  "job": {
    "id": "uuid-of-the-job",
    "status": "current-status"
  }
}
```

Or in case of an error:

```json
{
  "error": "Error message",
  "details": "Optional additional error details"
}
```

## Setting Up n8n Workflows

When creating n8n workflows that integrate with ModelPixie AI:

1. Create an HTTP webhook node to receive the initial request
2. Process the data as required for the specific operation
3. Include an HTTP Request node to call back to the ModelPixie AI endpoint with the appropriate payload
4. Set up error handling to notify ModelPixie AI about failures

## Environment Configuration

The n8n webhook integration relies on these environment variables:

- `N8N_WEBHOOK_SECRET_TOKEN`: Secret token for authenticating n8n callbacks
- `N8N_MODEL_GENERATION_URL`: URL for the n8n model generation workflow webhook
- `N8N_IMAGE_REFINEMENT_URL`: URL for the n8n image refinement workflow webhook
