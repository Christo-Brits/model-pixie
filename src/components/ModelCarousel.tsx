
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Cube } from 'lucide-react';

const mockModels = [
  { id: 1, name: "Robot Figurine", thumbnail: "robot" },
  { id: 2, name: "Desk Organizer", thumbnail: "organizer" },
  { id: 3, name: "Phone Stand", thumbnail: "stand" },
  { id: 4, name: "Geometric Vase", thumbnail: "vase" },
  { id: 5, name: "Custom Keychain", thumbnail: "keychain" },
];

export const ModelCarousel = () => {
  return (
    <Carousel 
      opts={{ align: "start", loop: true }}
      className="w-full"
    >
      <CarouselContent>
        {mockModels.map((model) => (
          <CarouselItem key={model.id} className="basis-1/2 md:basis-1/4 lg:basis-1/5">
            <Card className="overflow-hidden border-none shadow-sm">
              <CardContent className="p-0">
                <div className="aspect-square relative bg-muted/50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-pixie-purple/20 to-pixie-blue/20 rounded-md" />
                  <Cube className="h-10 w-10 text-pixie-purple/60" />
                </div>
                <div className="p-2 text-center">
                  <p className="text-sm font-medium truncate">{model.name}</p>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-3 bg-background shadow-sm" />
      <CarouselNext className="-right-3 bg-background shadow-sm" />
    </Carousel>
  );
};
