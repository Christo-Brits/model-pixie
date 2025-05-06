
import React from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Search, Heart, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const Community = () => {
  const categories = [
    { id: 1, name: "Games" },
    { id: 2, name: "Decor" },
    { id: 3, name: "Gadgets" },
    { id: 4, name: "Art" },
    { id: 5, name: "Figurines" },
    { id: 6, name: "Practical" }
  ];

  const trendingModels = [
    {
      id: 1, 
      title: "Mini Robot", 
      creator: "robotmaker", 
      likes: 18,
      avatar: "RM"
    },
    {
      id: 2, 
      title: "Phone Stand", 
      creator: "designlab", 
      likes: 32,
      avatar: "DL"
    },
    {
      id: 3, 
      title: "Geometric Vase", 
      creator: "3dprinter", 
      likes: 15,
      avatar: "3D"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopBar />
      
      <main className="flex-1 px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-pixie-purple" />
            <h1 className="text-2xl font-bold">Community</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Search className="h-5 w-5" />
          </button>
        </div>
        
        {/* Featured Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Featured</h2>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video relative bg-muted flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-pixie-purple/10 via-pixie-blue/10 to-pixie-pink/10" />
                <div className="h-full w-full relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-24 w-24 bg-pixie-purple/20 rounded-lg flex items-center justify-center">
                      <span className="text-4xl text-pixie-purple/70">3D</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 flex justify-between">
              <div>
                <h3 className="font-medium text-lg">Dragon Figurine</h3>
                <p className="text-sm text-muted-foreground">by @dragonmaster</p>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-pixie-purple/20 text-pixie-purple">DM</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Heart className="h-4 w-4 text-pixie-pink fill-pixie-pink" />
                  <span>24</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </section>
        
        {/* Trending Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Trending</h2>
          <div className="grid grid-cols-3 gap-3">
            {trendingModels.map((model) => (
              <Card key={model.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative bg-muted/30 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-pixie-blue/10 via-pixie-purple/5 to-pixie-pink/10" />
                    <div className="h-10 w-10 bg-pixie-blue/20 rounded-lg flex items-center justify-center">
                      <span className="text-xl text-pixie-blue/70">3D</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-2 flex justify-between">
                  <div>
                    <h3 className="font-medium text-xs">{model.title}</h3>
                    <p className="text-xs text-muted-foreground">@{model.creator}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Heart className="h-3 w-3 text-pixie-pink fill-pixie-pink" />
                    <span>{model.likes}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Categories Section */}
        <section className="mb-2">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="px-4 py-2 bg-muted hover:bg-accent whitespace-nowrap rounded-full transition-colors text-sm font-medium"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </section>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Community;
