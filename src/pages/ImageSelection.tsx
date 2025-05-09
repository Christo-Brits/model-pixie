
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { ImageVariationSelector } from '@/components/ImageVariationSelector';
import { toast } from '@/hooks/use-toast';
import { checkJobStatus, getStatusDescription } from '@/services/jobStatusService';
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types/job';
import { Loader2 } from 'lucide-react';

const ImageSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  
  // Extract jobId from location state or fallback to localStorage
  const jobId = location.state?.jobId || localStorage.getItem('currentJobId');

  useEffect(() => {
    if (!jobId) {
      toast({
        title: 'Error',
        description: 'No job ID found. Unable to load images.',
        variant: 'destructive'
      });
      navigate('/create');
      return;
    }

    // Store jobId in localStorage as a fallback
    localStorage.setItem('currentJobId', jobId);
    
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching job details for job: ${jobId}`);
        
        const status = await checkJobStatus(jobId);
        console.log(`Job status response:`, status);
        
        if (status.status !== 'images_ready') {
          toast({
            title: 'Images not ready',
            description: getStatusDescription(status.status),
          });
          
          if (['error', 'failed'].includes(status.status)) {
            navigate('/create');
          } else {
            navigate('/generating', { state: { jobId } });
          }
          return;
        }
        
        // Fetch the full job details to get variations
        const { data: jobData, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();
          
        if (error || !jobData) {
          console.error('Error fetching job details:', error);
          throw new Error('Failed to load job details');
        }
        
        console.log('Full job data:', jobData);
        
        // Ensure we have image variations
        if (!jobData.image_variations || !Array.isArray(jobData.image_variations) || jobData.image_variations.length === 0) {
          console.error('No image variations found in job data');
          toast({
            title: 'No images found',
            description: 'No image variations were found for this job. Please try again.',
            variant: 'destructive'
          });
          navigate('/create');
          return;
        }
        
        setJob(jobData as Job);
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load image variations. Please try again.',
          variant: 'destructive'
        });
        navigate('/create');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, navigate]);

  const handleVariationSelected = (variationId: number, imageUrl: string) => {
    console.log(`Variation selected: ID ${variationId}, URL: ${imageUrl}`);
    
    if (!imageUrl) {
      toast({
        title: 'Error',
        description: 'The selected image URL is invalid. Please try again.',
        variant: 'destructive'
      });
      return;
    }
    
    // Store the selected image URL in localStorage for fallback
    localStorage.setItem('selectedImageUrl', imageUrl);
    
    // Update job status to generating the 3D model
    navigate('/generating', { 
      state: { 
        jobId,
        selectedVariationId: variationId,
        selectedImageUrl: imageUrl
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg">Loading image variations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Choose Your Image</h1>
        
        {job && job.image_variations && job.image_variations.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-6">
              Select one of these generated images to create your 3D model
            </p>
            <ImageVariationSelector
              jobId={jobId}
              variations={job.image_variations}
              onVariationSelected={handleVariationSelected}
            />
          </>
        ) : (
          <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
            <p className="mb-4">No image variations found. Please try generating images again.</p>
            <button 
              onClick={() => navigate('/create')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Back to Create
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ImageSelection;
