
import React, { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { selectImageVariation } from '@/services/feedbackService';
import { Job } from '@/types/job';
import { Loader2 } from 'lucide-react';

type ImageVariation = {
  id: number;
  url: string;
  selected: boolean;
};

interface ImageVariationSelectorProps {
  jobId: string;
  variations: ImageVariation[];
  onVariationSelected: (variationId: number, imageUrl: string) => void;
}

export const ImageVariationSelector = ({
  jobId,
  variations,
  onVariationSelected,
}: ImageVariationSelectorProps) => {
  const [selectedVariation, setSelectedVariation] = useState<number | null>(
    variations.find(v => v.selected)?.id || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectVariation = async () => {
    if (!selectedVariation) {
      toast({
        title: "Please select an image",
        description: "You must select one of the generated images to proceed",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedImage = variations.find(v => v.id === selectedVariation);
      if (!selectedImage) throw new Error("Selected variation not found");

      await selectImageVariation(jobId, selectedVariation);
      
      toast({
        title: "Image selected",
        description: "Your selected image will be used for 3D model generation",
      });
      
      onVariationSelected(selectedVariation, selectedImage.url);
    } catch (error) {
      console.error('Error selecting image variation:', error);
      toast({
        title: "Selection failed",
        description: "There was a problem selecting your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Select an image to create your 3D model</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the image that best represents your concept for 3D generation
        </p>
      </div>

      <RadioGroup
        value={selectedVariation?.toString()}
        onValueChange={(value) => setSelectedVariation(parseInt(value))}
        className="grid grid-cols-2 gap-4"
      >
        {variations.map((variation) => (
          <Label
            key={variation.id}
            htmlFor={`variation-${variation.id}`}
            className="cursor-pointer group"
          >
            <Card className={`overflow-hidden border-2 transition-all ${
              selectedVariation === variation.id 
                ? 'border-primary shadow-lg' 
                : 'border-transparent hover:border-muted-foreground/20'
            }`}>
              <AspectRatio ratio={1 / 1} className="bg-muted">
                <img
                  src={variation.url}
                  alt={`Variation ${variation.id}`}
                  className="object-cover w-full h-full rounded-sm"
                />
              </AspectRatio>
              <div className="p-2 flex items-center">
                <RadioGroupItem
                  value={variation.id.toString()}
                  id={`variation-${variation.id}`}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Variation {variation.id}</span>
              </div>
            </Card>
          </Label>
        ))}
      </RadioGroup>

      <Button 
        onClick={handleSelectVariation} 
        className="w-full pixie-gradient text-white"
        disabled={isSubmitting || !selectedVariation}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Use Selected Image'
        )}
      </Button>
    </div>
  );
};
