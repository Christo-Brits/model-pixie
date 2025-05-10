
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Steps, Step } from '@/components/ui/step';
import { Info } from 'lucide-react';

interface BlenderInstructionsProps {
  imageUrl: string;
}

export const BlenderInstructions: React.FC<BlenderInstructionsProps> = ({ imageUrl }) => {
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>How to Use with Blender</CardTitle>
        <CardDescription>
          Follow these steps to create your 3D model using the Meshy Blender plugin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Steps>
          <Step title="Download Blender">
            <p>Download and install <a href="https://www.blender.org/download/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Blender</a> if you don't have it already (version 2.93 or newer recommended).</p>
          </Step>
          
          <Step title="Install Meshy Plugin">
            <p>Download the <a href="https://www.meshy.ai/download-plugin" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Meshy Blender Plugin</a> and install it in Blender via Edit &gt; Preferences &gt; Add-ons &gt; Install.</p>
          </Step>
          
          <Step title="Load Your Image">
            <p>In Blender, open the Meshy panel and click "Load Image". Select the GPT-Image-1 generated image you downloaded from this app.</p>
            <div className="mt-2 bg-amber-50 p-3 rounded-md border border-amber-200 text-xs">
              <p className="text-amber-800 flex items-start">
                <Info className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" /> 
                <span>For best results, position your camera to capture the object clearly with good lighting and contrast against the background.</span>
              </p>
            </div>
          </Step>
          
          <Step title="Generate 3D Model">
            <p>Follow the plugin instructions to convert your image into a 3D model. The plugin uses Meshy's powerful AI to create high-quality meshes with textures.</p>
            <div className="mt-2 text-xs text-muted-foreground">
              <p><strong>Available Output Formats:</strong> GLB, FBX, OBJ, and USDZ</p>
              <p><strong>Mesh Quality:</strong> You can adjust polygon count and mesh topology (triangular or quad-dominant mesh)</p>
            </div>
          </Step>
          
          <Step title="Export for 3D Printing">
            <p>Once satisfied with your model, export it as an STL file for 3D printing via File &gt; Export &gt; STL.</p>
            <div className="mt-2 text-xs text-muted-foreground">
              <p>If your model has textures, you may want to save those separately for future use.</p>
            </div>
          </Step>
        </Steps>
        
        <div className="mt-6">
          <h4 className="font-medium text-lg mb-2">Your GPT-Image-1 Generated Image</h4>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <img src={imageUrl} alt="GPT-Image-1 generated concept for 3D model" className="w-full h-auto" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            This high-quality image has been generated with GPT-Image-1 and optimized for use with the Meshy Blender plugin.
          </p>
          <div className="mt-3 bg-blue-50 p-3 rounded-md border border-blue-200 text-sm">
            <p className="text-blue-800">
              <strong>Image Tips:</strong> For best 3D model results, ensure your image has:
            </p>
            <ul className="mt-1 text-xs text-blue-700 list-disc pl-4 space-y-1">
              <li>A clear view of the object (minimal occlusion)</li>
              <li>Good lighting with minimal shadows</li>
              <li>A simple or neutral background</li>
              <li>Showing the most detailed side of the object</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Coming Soon:</strong> Direct 3D model generation without requiring Blender. 
            We're working on integrating with Meshy's API to provide a seamless experience with options like:
          </p>
          <ul className="mt-2 text-xs text-blue-600 list-disc pl-4 space-y-1">
            <li>Multiple texture options</li>
            <li>Adjustable mesh quality</li>
            <li>Direct download in various formats (GLB, FBX, OBJ, USDZ)</li>
            <li>Multi-image model generation for improved accuracy</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
