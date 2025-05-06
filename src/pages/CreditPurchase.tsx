
import React, { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, PayPal, Apple } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const CreditPurchase = () => {
  const [selectedPackage, setSelectedPackage] = useState<string>("package2");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const navigate = useNavigate();
  
  const handlePurchase = () => {
    toast.success("Purchase successful!", {
      description: "Credits have been added to your account."
    });
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      
      <main className="flex-1 px-4 py-6 space-y-8 mb-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Buy Credits</h1>
          <p className="text-muted-foreground mt-1">Power your creations with Pixie credits</p>
        </div>
        
        {/* Credit packages */}
        <div className="space-y-4">
          <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="space-y-5">
            {/* Package 1 */}
            <label 
              htmlFor="package1" 
              className={`block cursor-pointer transition-all ${selectedPackage === "package1" ? "ring-2 ring-primary" : ""}`}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="pt-6 pb-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">1 Credit</h3>
                    <p className="text-sm text-muted-foreground">Single model creation</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">$5.00</div>
                    <div className="text-sm text-muted-foreground">per credit</div>
                  </div>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <RadioGroupItem value="package1" id="package1" className="mr-2" />
                  </div>
                </CardContent>
              </Card>
            </label>
            
            {/* Package 2 */}
            <label 
              htmlFor="package2" 
              className={`block cursor-pointer transition-all ${selectedPackage === "package2" ? "ring-2 ring-primary" : ""}`}
            >
              <Card className="relative overflow-hidden bg-gradient-to-r from-background to-primary/5">
                <div className="absolute top-0 right-0">
                  <Badge className="m-2 bg-primary text-primary-foreground">POPULAR CHOICE!</Badge>
                </div>
                <CardContent className="pt-6 pb-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">5 Credits</h3>
                    <p className="text-sm text-muted-foreground">Multiple model creations</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">$20.00</div>
                    <div className="text-sm text-primary font-medium">$4.00 each</div>
                  </div>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <RadioGroupItem value="package2" id="package2" className="mr-2" />
                  </div>
                </CardContent>
              </Card>
            </label>
            
            {/* Package 3 */}
            <label 
              htmlFor="package3" 
              className={`block cursor-pointer transition-all ${selectedPackage === "package3" ? "ring-2 ring-primary" : ""}`}
            >
              <Card className="relative overflow-hidden bg-gradient-to-r from-background to-accent/10">
                <div className="absolute top-0 right-0">
                  <Badge className="m-2 bg-accent text-accent-foreground">BEST VALUE!</Badge>
                </div>
                <CardContent className="pt-6 pb-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">15 Credits</h3>
                    <p className="text-sm text-muted-foreground">Studio package</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">$50.00</div>
                    <div className="text-sm text-accent font-medium">$3.33 each</div>
                  </div>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <RadioGroupItem value="package3" id="package3" className="mr-2" />
                  </div>
                </CardContent>
              </Card>
            </label>
          </RadioGroup>
        </div>
        
        {/* Payment Methods */}
        <div className="space-y-3">
          <h3 className="font-medium">Payment Method</h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-3">
            <div className={`border rounded-md px-4 py-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'bg-primary/5 border-primary' : 'hover:border-muted-foreground'}`}>
              <RadioGroupItem value="card" id="card" className="sr-only" />
              <CreditCard className="h-6 w-6" />
              <Label htmlFor="card" className="cursor-pointer text-sm">Credit Card</Label>
            </div>
            
            <div className={`border rounded-md px-4 py-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'bg-primary/5 border-primary' : 'hover:border-muted-foreground'}`}>
              <RadioGroupItem value="paypal" id="paypal" className="sr-only" />
              <PayPal className="h-6 w-6" />
              <Label htmlFor="paypal" className="cursor-pointer text-sm">PayPal</Label>
            </div>
            
            <div className={`border rounded-md px-4 py-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${paymentMethod === 'apple' ? 'bg-primary/5 border-primary' : 'hover:border-muted-foreground'}`}>
              <RadioGroupItem value="apple" id="apple" className="sr-only" />
              <Apple className="h-6 w-6" />
              <Label htmlFor="apple" className="cursor-pointer text-sm">Apple Pay</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Decorative elements */}
        <div className="relative">
          <div aria-hidden="true" className="absolute left-0 w-20 h-20 -z-10 bg-primary/10 rounded-full blur-xl opacity-70"></div>
          <div aria-hidden="true" className="absolute right-0 w-16 h-16 -z-10 bg-accent/10 rounded-full blur-lg opacity-70"></div>
          
          {/* Purchase button */}
          <Button onClick={handlePurchase} className="w-full py-6" size="lg">
            Complete Purchase
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            Secure payment processing. Your credits will be available instantly.
          </p>
        </div>
        
        {/* 3D printing decorative elements */}
        <div className="relative h-10 mt-4">
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10"></div>
          <div className="absolute bottom-6 left-1/4 w-[2px] h-6 bg-primary/20"></div>
          <div className="absolute bottom-4 left-2/4 w-[2px] h-4 bg-primary/30"></div>
          <div className="absolute bottom-8 left-3/4 w-[2px] h-8 bg-primary/20"></div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default CreditPurchase;
