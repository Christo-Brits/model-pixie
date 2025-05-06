
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Cube } from 'lucide-react';

const highlights = [
  {
    id: 1,
    title: "Futuristic Cityscape",
    creator: "Alex Chen",
    likes: 124,
    avatar: "AC"
  },
  {
    id: 2,
    title: "Organic Sculpture",
    creator: "Maya Johnson",
    likes: 98,
    avatar: "MJ"
  }
];

export const CommunityHighlights = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {highlights.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-video relative bg-muted/30 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-pixie-blue/20 via-pixie-purple/10 to-pixie-pink/20" />
              <Cube className="h-12 w-12 text-pixie-purple/70" />
            </div>
          </CardContent>
          <CardFooter className="p-3 flex justify-between">
            <div>
              <h3 className="font-medium text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground">by {item.creator}</p>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-pixie-purple/20 text-pixie-purple">{item.avatar}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{item.likes} ♥</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
