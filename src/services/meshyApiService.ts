
/**
 * Direct interface to the Meshy API for 3D model generation
 * This can be used for testing or as a reference implementation
 */

/**
 * Generate a 3D model from an image URL using the Meshy API directly
 * @param imageUrl URL of the image to convert to 3D
 * @param apiKey Meshy API key
 */
export const generateMeshyModel = async (imageUrl: string, apiKey: string) => {
  try {
    if (!apiKey) {
      throw new Error("Meshy API key is required");
    }

    // Make request to Meshy API
    const response = await fetch("https://api.meshy.ai/v1/image-to-3d", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "image_url": imageUrl,
        "generation_type": "mesh", // Options: texture, mesh
        "output_format": "glb"     // Options: glb, obj, stl, usdz
      })
    });

    // Handle errors
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = `Meshy API error: ${JSON.stringify(errorData)}`;
      } catch (e) {
        // If JSON parsing fails, use the status code message
      }
      
      throw new Error(errorMessage);
    }

    // Parse and return the response
    const data = await response.json();
    return {
      success: true,
      taskId: data.task_id,
      status: data.status
    };
  } catch (error) {
    console.error("Meshy model generation error:", error);
    throw error;
  }
};

/**
 * Check the status of a model generation task
 * @param taskId The task ID returned from the generation call
 * @param apiKey Meshy API key
 */
export const checkMeshyModelStatus = async (taskId: string, apiKey: string) => {
  try {
    if (!apiKey) {
      throw new Error("Meshy API key is required");
    }

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    // Make request to Meshy API to check status
    const response = await fetch(`https://api.meshy.ai/v1/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    // Handle errors
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = `Meshy API error: ${JSON.stringify(errorData)}`;
      } catch (e) {
        // If JSON parsing fails, use the status code message
      }
      
      throw new Error(errorMessage);
    }

    // Parse the response
    const data = await response.json();
    return {
      success: true,
      taskId: data.task_id,
      status: data.status,
      progress: data.progress,
      modelUrl: data.results?.glb_url || data.results?.model_url || null,
      error: data.error || null
    };
  } catch (error) {
    console.error("Meshy status check error:", error);
    throw error;
  }
};
