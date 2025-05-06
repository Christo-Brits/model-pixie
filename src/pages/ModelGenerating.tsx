
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModelGenerationLoading } from '@/components/ModelGenerationLoading';
import { toast } from '@/hooks/use-toast';

const ModelGenerating = () => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    toast({
      title: 'Generation cancelled',
      description: 'Your credit has been returned to your account.',
    });
    navigate('/create');
  };
  
  return (
    <ModelGenerationLoading 
      progress={67} 
      estimatedTime="45 sec" 
      creditUsage={1}
      onCancel={handleCancel}
    />
  );
};

export default ModelGenerating;
