
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Steps, Step } from '@/components/ui/step';

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
            <p>Download and install <a href="https://www.blender.org/download/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Blender</a> if you don't have it already.</p>
          </Step>
          
          <Step title="Install Meshy Plugin">
            <p>Download the <a href="https://www.meshy.ai/download-plugin" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Meshy Blender Plugin</a> and install it in Blender via Edit &gt; Preferences &gt; Add-ons &gt; Install.</p>
          </Step>
          
          <Step title="Load Your Image">
            <p>In Blender, open the Meshy panel and click "Load Image". Select the GPT-Image-1 generated image you downloaded from this app.</p>
          </Step>
          
          <Step title="Generate 3D Model">
            <p>Follow the plugin instructions to convert your image into a 3D model. Adjust settings as needed for the best results.</p>
          </Step>
          
          <Step title="Export for 3D Printing">
            <p>Once satisfied with your model, export it as an STL file for 3D printing via File &gt; Export &gt; STL.</p>
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
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Coming Soon:</strong> Direct 3D model generation without requiring Blender. 
            We're working on integrating with Meshy's API to provide a seamless experience.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
