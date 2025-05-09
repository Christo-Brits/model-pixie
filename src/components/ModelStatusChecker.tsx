
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
  const lastProgressRef = useRef<number>(20); // Start at 20% since we've already initiated
  const processingStartTimeRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);
  const pollingCountRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);
  
  useEffect(() => {
    // Setup max timeout to prevent infinite waiting - reduce from 15 to 10 minutes
    if (!maxTimeoutRef.current) {
      // Set max timeout to 10 minutes (600000ms) to prevent excessive waiting
      maxTimeoutRef.current = window.setTimeout(() => {
        console.warn('Maximum generation time exceeded (10 minutes)');
        onError(new Error('Generation is taking too long. Please try again later.'));
        cleanupIntervals();
      }, 600000); // 10 minutes
    }
    
    // Don't poll if there's an error or no predictionId
    if (hasError || !predictionId) return;

    // Start tracking processing time
    if (!processingStartTimeRef.current) {
      processingStartTimeRef.current = Date.now();
      console.log('Starting model status polling at:', new Date().toISOString());
    }
    
    // Function to clean up all intervals and timeouts
    const cleanupIntervals = () => {
      console.log('Cleaning up intervals and timeouts');
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
    
    // Only setup polling once
    if (pollingIntervalRef.current) return;
    
    const checkModelStatus = async () => {
      try {
        if (hasError) return;
        if (!predictionId) {
          console.log('No prediction ID available yet, skipping status check');
          return;
        }
        
        pollingCountRef.current += 1;
        console.log(`Checking status for model with job ID: ${jobId}, prediction ID: ${predictionId}, poll #${pollingCountRef.current}`);
        
        // Check status using the prediction ID
        const status = await checkModelGenerationStatus(jobId);
        console.log("Model status check returned:", status);
        
        // Reset consecutive errors counter since this request succeeded
        consecutiveErrorsRef.current = 0;
        
        if (status.status === 'processing' || status.status === 'starting' || status.status === 'rendering') {
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
            progressValue = 25 + (pollingCountRef.current * 2); // Increment by 2% each poll at the start
            timeMessage = 'Estimated time: 5-7 minutes';
          } else if (elapsedMinutes < 3) {
            progressValue = 40 + (pollingCountRef.current * 1); 
            timeMessage = 'Estimated time: 4-5 minutes';
          } else if (elapsedMinutes < 5) {
            progressValue = 60 + Math.min((pollingCountRef.current * 0.5), 10); // Slower increments
            timeMessage = 'Estimated time: 2-3 minutes';
          } else {
            progressValue = 85;
            timeMessage = 'Almost done';
          }
          
          // Never go backwards in progress and cap at 95%
          progressValue = Math.min(95, Math.max(progressValue, lastProgressRef.current));
          console.log(`Setting progress to ${progressValue}%`);
          
          if (progressValue > lastProgressRef.current) {
            lastProgressRef.current = progressValue;
            onStatusUpdate(`Processing model. ${timeMessage}`, progressValue);
          }
        } else if (status.status === 'succeeded' || status.status === 'completed') {
          cleanupIntervals();
          onStatusUpdate('Model generation complete!', 100);
          
          toast.success('Model generated successfully!', {
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
        
        // Count consecutive errors
        consecutiveErrorsRef.current += 1;
        console.log(`Consecutive errors: ${consecutiveErrorsRef.current}`);
        
        // After 5 consecutive errors (not 10), consider it a failure
        if (consecutiveErrorsRef.current >= 5) {
          cleanupIntervals();
          onError(new Error('Connection issues while checking model status. Please try again.'));
        }
      }
    };
    
    // Check status immediately
    checkModelStatus();
      
    // Then poll every 6 seconds (previously 10)
    pollingIntervalRef.current = window.setInterval(checkModelStatus, 6000);
    
    // Setup visual progress indicator - only increment gradually for visual feedback
    visualProgressIntervalRef.current = window.setInterval(() => {
      if (hasError) return;
      
      // Only increment progress if we're below 90%
      if (lastProgressRef.current < 90) {
        const smallIncrement = 1;
        lastProgressRef.current += smallIncrement;
        console.log(`Visual progress update: ${lastProgressRef.current}%`);
        onStatusUpdate('', lastProgressRef.current);
      }
    }, 12000); // Faster visual updates (12s instead of 15s)
    
    // Cleanup function
    return cleanupIntervals;
  }, [jobId, predictionId, selectedImageUrl, hasError, onError, onStatusUpdate, navigate]);

  return null; // This is a logic-only component
};
