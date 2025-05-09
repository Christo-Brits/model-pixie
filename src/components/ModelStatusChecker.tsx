
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { checkModelGenerationStatus } from '@/services/generationService';

interface ModelStatusCheckerProps {
  jobId: string;
  predictionId: string | null;
  selectedImageUrl: string | undefined;
  hasError: boolean;
  onStatusUpdate: (status: string, progress: number) => void;
  onError: (error: Error) => void;
}

export const ModelStatusChecker: React.FC<ModelStatusCheckerProps> = ({
  jobId,
  predictionId,
  selectedImageUrl,
  hasError,
  onStatusUpdate,
  onError
}) => {
  const navigate = useNavigate();
  const pollingIntervalRef = useRef<number | null>(null);
  const visualProgressIntervalRef = useRef<number | null>(null);
  const lastProgressRef = useRef<number>(0);
  const processingStartTimeRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Setup max timeout to prevent infinite waiting
    if (!maxTimeoutRef.current) {
      // Set max timeout to 15 minutes (900000ms)
      maxTimeoutRef.current = window.setTimeout(() => {
        console.warn('Maximum generation time exceeded (15 minutes)');
        onError(new Error('Generation is taking too long. Please try again later.'));
        cleanupIntervals();
      }, 900000);
    }
    
    // Don't poll if there's an error or no predictionId
    if (hasError || !predictionId) return;

    // Start tracking processing time
    if (!processingStartTimeRef.current) {
      processingStartTimeRef.current = Date.now();
    }
    
    // Only setup polling once
    if (pollingIntervalRef.current) return;
    
    const checkModelStatus = async () => {
      try {
        if (hasError) return;
        if (!predictionId) {
          console.log('No prediction ID available yet, skipping status check');
          return;
        }
        
        console.log(`Checking status for model with job ID: ${jobId}, prediction ID: ${predictionId}`);
        
        // Check status using the prediction ID
        const status = await checkModelGenerationStatus(jobId);
        console.log("Model status check returned:", status);
        
        if (status.status === 'processing' || status.status === 'starting') {
          // Calculate how long we've been processing
          const elapsedMinutes = processingStartTimeRef.current ? 
            (Date.now() - processingStartTimeRef.current) / 60000 : 0;
          
          // Set progress based on time elapsed
          let progressValue;
          let timeMessage;
          
          if (status.progress) {
            // If API provides progress, use it
            progressValue = Math.round(status.progress * 100);
            timeMessage = status.estimatedTimeRemaining || 'Processing...';
          } else if (elapsedMinutes < 1) {
            progressValue = 25;
            timeMessage = 'Estimated time: 5-7 minutes';
          } else if (elapsedMinutes < 3) {
            progressValue = 50;
            timeMessage = 'Estimated time: 4-5 minutes';
          } else if (elapsedMinutes < 5) {
            progressValue = 70;
            timeMessage = 'Estimated time: 2-3 minutes';
          } else {
            progressValue = 85;
            timeMessage = 'Almost done';
          }
          
          // Never go backwards in progress
          if (progressValue > lastProgressRef.current) {
            lastProgressRef.current = progressValue;
            onStatusUpdate(`Processing model. ${timeMessage}`, progressValue);
          }
        } else if (status.status === 'succeeded' || status.status === 'completed') {
          cleanupIntervals();
          onStatusUpdate('Model generation complete!', 100);
          
          toast('Model generated successfully!', {
            description: 'Your 3D model is ready to preview.'
          });
          
          navigate('/preview', { 
            state: { 
              jobId,
              modelUrl: status.modelUrl,
              imageUrl: selectedImageUrl 
            } 
          });
        } else if (status.status === 'failed' || status.status === 'error') {
          cleanupIntervals();
          onError(new Error(status.error || 'There was a problem generating your model.'));
        }
      } catch (error: any) {
        console.error('Error checking model status:', error);
      }
    };
    
    // Function to clean up all intervals and timeouts
    const cleanupIntervals = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (visualProgressIntervalRef.current) {
        clearInterval(visualProgressIntervalRef.current);
        visualProgressIntervalRef.current = null;
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = null;
      }
    };
    
    // Check status immediately
    checkModelStatus();
      
    // Then poll every 10 seconds
    pollingIntervalRef.current = window.setInterval(checkModelStatus, 10000);
    
    // Setup visual progress indicator - only increment gradually for visual feedback
    visualProgressIntervalRef.current = window.setInterval(() => {
      if (hasError) return;
      
      // Only increment progress if we're below 90%
      if (lastProgressRef.current < 90) {
        const smallIncrement = 1;
        lastProgressRef.current += smallIncrement;
        onStatusUpdate('', lastProgressRef.current);
      }
    }, 15000); // Slower visual updates (15s)
    
    // Cleanup function
    return cleanupIntervals;
  }, [jobId, predictionId, selectedImageUrl, hasError]);

  return null; // This is a logic-only component
};
