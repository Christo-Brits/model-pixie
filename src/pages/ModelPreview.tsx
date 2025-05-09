
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ModelViewer } from '@/components/ModelViewer';
import { Button } from '@/components/ui/button';
import { Download, Share2, Home, Undo2 } from 'lucide-react';
import { BlenderInstructions } from '@/components/BlenderInstructions';

const ModelPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [usingBlenderWorkflow, setUsingBlenderWorkflow] = useState(false);
  
  // Extract state on component mount
  useEffect(() => {
    const state = location.state as any;
    
    const locJobId = state?.jobId || localStorage.getItem('currentJobId');
    const locModelUrl = state?.modelUrl || localStorage.getItem('currentModelUrl');
    const locImageUrl = state?.imageUrl || localStorage.getItem('selectedImageUrl');
    const isBlenderWorkflow = state?.usingBlenderWorkflow || false;
    
    setJobId(locJobId);
    setModelUrl(locModelUrl);
    setImageUrl(locImageUrl);
    setUsingBlenderWorkflow(isBlenderWorkflow);
    
    // Store values in localStorage for persistence
    if (locJobId) localStorage.setItem('currentJobId', locJobId);
    if (locModelUrl) localStorage.setItem('currentModelUrl', locModelUrl);
    if (locImageUrl) localStorage.setItem('selectedImageUrl', locImageUrl);
  }, [location.state]);
  
  // Handle download image
  const handleDownloadImage = () => {
    if (!imageUrl) {
      toast.error('No image available to download');
      return;
    }
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `model-image-${jobId || 'download'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Image downloaded successfully');
  };
  
  // Handle download model
  const handleDownloadModel = () => {
    if (!modelUrl) {
      toast.error('No model available to download');
      return;
    }
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = modelUrl;
    link.download = `3d-model-${jobId || 'download'}.stl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('3D model downloaded successfully');
  };
  
  // Handle share
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out my 3D model!',
          text: 'I created this 3D model using ModelPixie',
          url: window.location.href
        });
      } else {
        // Fallback - copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };
  
  // Handle navigation
  const handleGoToHome = () => {
    navigate('/');
  };
  
  const handleGoToModels = () => {
    navigate('/models');
  };
  
  const handleCreateNew = () => {
    navigate('/create');
  };
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <TopBar />
      
      {usingBlenderWorkflow && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center p-2 text-sm">
          BETA FEATURE: Direct 3D model generation coming soon!
        </div>
      )}
      
      <main className="flex-1 px-4 py-6 mt-8 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {usingBlenderWorkflow ? 'Your Generated Image' : 'Your 3D Model'}
          </h1>
          
          <Button variant="outline" size="sm" onClick={handleCreateNew}>
            <Undo2 className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
        
        {usingBlenderWorkflow ? (
          // Blender workflow - show image and instructions
          <>
            {imageUrl ? (
              <div className="mb-6">
                <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Generated concept for 3D model"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3 mb-8">
              <Button onClick={handleDownloadImage} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Download Image
              </Button>
              
              <Button variant="outline" onClick={handleShare} className="flex-1 sm:flex-none">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <Button variant="ghost" onClick={handleGoToHome} className="flex-1 sm:flex-none">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
            
            <BlenderInstructions imageUrl={imageUrl || ''} />
          </>
        ) : (
          // Standard workflow - show 3D model viewer (not implemented in this update)
          <>
            {modelUrl ? (
              <div className="mb-6">
                <ModelViewer modelUrl={modelUrl} />
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <p className="text-gray-400">No model available</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3 mb-8">
              <Button onClick={handleDownloadModel} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Download STL
              </Button>
              
              <Button variant="outline" onClick={handleShare} className="flex-1 sm:flex-none">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <Button variant="ghost" onClick={handleGoToHome} className="flex-1 sm:flex-none">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </>
        )}
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default ModelPreview;
