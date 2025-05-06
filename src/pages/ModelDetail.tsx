
import React from 'react';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { ModelViewer } from '@/components/ModelViewer';
import { Share2, Edit, Trash2, Download, RotateCw, RotateCcw, ZoomIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

const ModelDetail = () => {
  const navigate = useNavigate();
  
  const handleDelete = () => {
    toast.success("Model successfully deleted");
    navigate("/models");
  };

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopBar />
      
      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Dragon Figurine</h1>
        </div>
        <p className="text-muted-foreground mb-5">Created: May 4, 2025</p>
        
        {/* 3D Model Viewer */}
        <div className="relative bg-gradient-to-b from-background to-muted/30 rounded-xl mb-6 overflow-hidden h-[40vh] sm:h-[50vh] shadow-lg">
          <ModelViewer modelType="dragon" />
          
          {/* Controls overlay */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button variant="secondary" size="icon" className="rounded-full bg-background/70 backdrop-blur-sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full bg-background/70 backdrop-blur-sm">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full bg-background/70 backdrop-blur-sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Technical specifications */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-3">Model Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium">100x50x75mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File size:</span>
                  <span className="font-medium">2.4MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File format:</span>
                  <span className="font-medium">STL</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Print recommendations */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-3">Print Recommendations</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="min-w-2 h-2 w-2 mt-1.5 rounded-full bg-pixie-purple"></div>
                  <span><span className="text-muted-foreground">Layer height:</span> 0.2mm</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-2 h-2 w-2 mt-1.5 rounded-full bg-pixie-blue"></div>
                  <span><span className="text-muted-foreground">Support:</span> Yes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-2 h-2 w-2 mt-1.5 rounded-full bg-pixie-lightPurple"></div>
                  <span><span className="text-muted-foreground">Infill:</span> 15%</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        {/* Download button */}
        <Button className="w-full mb-6 pixie-gradient text-white shadow-lg gap-2 py-6" size="lg">
          <Download className="h-5 w-5" /> Download as STL
        </Button>
        
        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" className="gap-2 text-destructive hover:text-destructive-foreground hover:bg-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ModelDetail;
