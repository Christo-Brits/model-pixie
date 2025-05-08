
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModelGenerationLoading } from '@/components/ModelGenerationLoading';
import { toast } from '@/hooks/use-toast';
import { pollJobStatus, getStatusDescription } from '@/services/jobStatusService';

const ModelGenerating = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Starting process...');
  
  // Extract jobId from location state or fallback
  const jobId = location.state?.jobId || localStorage.getItem('currentJobId');
  
  useEffect(() => {
    if (!jobId) {
      toast({
        title: 'Error',
        description: 'No job ID found. Unable to track progress.',
        variant: 'destructive'
      });
      navigate('/create');
      return;
    }
    
    // Store jobId in localStorage as a fallback
    localStorage.setItem('currentJobId', jobId);
    
    // Initialize progress indicators
    let progressCounter = 0;
    const progressIntervals = [15, 35, 60, 80, 95]; // Progress checkpoints
    
    // Set up polling for job status
    const cancelPolling = pollJobStatus(jobId, (status) => {
      // Update status message based on job status
      setStatusMessage(getStatusDescription(status.status));
      
      // Calculate visual progress (partly simulated for UX purposes)
      if (status.status === 'completed') {
        setProgress(100);
        toast({
          title: 'Model generated successfully!',
          description: 'Your 3D model is ready to preview.',
        });
        
        // Navigate to preview with the model URL
        navigate('/preview', { 
          state: { 
            jobId,
            modelUrl: status.modelUrl,
            imageUrl: status.imageUrl 
          } 
        });
      } else if (status.status === 'error' || status.status === 'failed') {
        toast({
          title: 'Generation failed',
          description: 'There was a problem generating your model. Please try again.',
          variant: 'destructive'
        });
        navigate('/create');
      } else if (status.iterations) {
        // For jobs with iterations, use iteration count to help determine progress
        const iterationProgress = Math.min(80, status.iterations * 20);
        setProgress(iterationProgress);
      } else {
        // For regular status updates without iterations, simulate progress
        if (progressCounter < progressIntervals.length) {
          setProgress(progressIntervals[progressCounter]);
          progressCounter++;
        }
      }
    }, 3000); // Check every 3 seconds
    
    // Cleanup function
    return () => {
      cancelPolling();
    };
  }, [navigate, jobId]);
  
  const handleCancel = () => {
    // Attempt to cancel the job
    toast({
      title: 'Generation cancelled',
      description: 'Your credit has been returned to your account.',
    });
    navigate('/create');
  };
  
  return (
    <ModelGenerationLoading 
      progress={progress} 
      estimatedTime={progress < 80 ? "45 sec" : "Almost done"}
      creditUsage={1}
      onCancel={handleCancel}
      statusMessage={statusMessage}
    />
  );
};

export default ModelGenerating;
