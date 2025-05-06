
import React from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Search, Book, Layers, Lightbulb, Cuboid, Scissors, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible } from '@/components/ui/collapsible';

const Learn = () => {
  const categories = [
    { id: 1, name: "Basics", icon: Book, color: "bg-blue-100" },
    { id: 2, name: "FDM", icon: Layers, color: "bg-green-100" },
    { id: 3, name: "Tips", icon: Lightbulb, color: "bg-yellow-100" },
    { id: 4, name: "Models", icon: Cuboid, color: "bg-purple-100" },
    { id: 5, name: "Slicing", icon: Scissors, color: "bg-red-100" },
    { id: 6, name: "Post", icon: Wrench, color: "bg-indigo-100" },
  ];

  const articles = [
    {
      id: 1,
      title: "Support Structures 101",
      date: "May 2, 2025",
      readTime: "6 min read",
    },
    {
      id: 2,
      title: "Choosing Filament",
      date: "Apr 29, 2025",
      readTime: "8 min read",
    }
  ];

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopBar />
      
      <main className="flex-1 px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-pixie-purple" />
            <h1 className="text-2xl font-bold">Learn</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Search className="h-5 w-5" />
          </button>
        </div>
        
        {/* Featured Tutorial Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Featured Tutorial</h2>
          <Card className="overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-0">
              <div className="aspect-video relative bg-muted flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                <div className="h-full w-full relative">
                  <div className="absolute inset-0 flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="text-xl font-bold">Perfect First Layer</h3>
                      <p className="text-sm opacity-90">Master the foundation of successful prints</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-pixie-purple/90 text-white px-2 py-1 rounded text-xs font-medium">
                  FEATURED
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        
        {/* Browse Topics Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Browse Topics</h2>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${category.color} border-none`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-base">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">Learn more</p>
                  </div>
                  <category.icon className="h-8 w-8 opacity-70" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Recent Articles Section */}
        <section className="mb-2">
          <h2 className="text-lg font-semibold mb-4">Recent Articles</h2>
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id} className="overflow-hidden hover:bg-muted/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-medium text-base mb-1">{article.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{article.date}</span>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                    <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Learn;
