
import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Apple, Wallet, RefreshCw, Check } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { 
  createCheckoutSession, 
  handleCheckoutResult, 
  creditPackages 
} from '@/services/paymentService';

const CreditPurchase = () => {
  const [selectedPackage, setSelectedPackage] = useState<string>("package2");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { credits, loading: creditsLoading, refetchCredits } = useCredits();
  
  // Check for checkout success or cancellation
  useEffect(() => {
    const checkoutCompleted = handleCheckoutResult(searchParams);
    if (checkoutCompleted) {
      refetchCredits();
    }
  }, [searchParams]);
  
  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please sign in to purchase credits", {
        description: "You must be signed in to complete this purchase."
      });
      navigate('/auth');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await createCheckoutSession(selectedPackage);
      // Redirect happens in createCheckoutSession
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Checkout failed", {
        description: "An error occurred during the checkout process."
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      
      <main className="flex-1 px-4 py-6 space-y-8 mb-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Buy Credits</h1>
          <p className="text-muted-foreground mt-1">Power your creations with Pixie credits</p>
          
          {!creditsLoading && (
            <div className="mt-2 flex justify-center items-center gap-2">
              <span className="text-sm font-medium">Current balance: {credits} credits</span>
              <Button variant="ghost" size="sm" onClick={refetchCredits} className="h-6 w-6 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Credit packages */}
        <div className="space-y-4">
          <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="space-y-5">
            {creditPackages.map((pkg) => (
              <label 
                key={pkg.id}
                htmlFor={pkg.id} 
                className={`block cursor-pointer transition-all ${selectedPackage === pkg.id ? "ring-2 ring-primary" : ""}`}
              >
                <Card className={`relative overflow-hidden ${
                  pkg.popular ? "bg-gradient-to-r from-background to-primary/5" : 
                  pkg.bestValue ? "bg-gradient-to-r from-background to-accent/10" : ""
                }`}>
                  {pkg.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="m-2 bg-primary text-primary-foreground">POPULAR CHOICE!</Badge>
                    </div>
                  )}
                  
                  {pkg.bestValue && (
                    <div className="absolute top-0 right-0">
                      <Badge className="m-2 bg-accent text-accent-foreground">BEST VALUE!</Badge>
                    </div>
                  )}
                  
                  <CardContent className="pt-6 pb-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{pkg.credits} Credit{pkg.credits > 1 ? "s" : ""}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pkg.credits === 1 ? "Single model creation" : 
                         pkg.credits === 5 ? "Multiple model creations" : "Studio package"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">${pkg.price.toFixed(2)}</div>
                      {pkg.credits > 1 && (
                        <div className={`text-sm ${pkg.popular ? "text-primary" : pkg.bestValue ? "text-accent" : ""} font-medium`}>
                          ${(pkg.price / pkg.credits).toFixed(2)} each
                        </div>
                      )}
                    </div>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <RadioGroupItem value={pkg.id} id={pkg.id} className="mr-2" />
                    </div>
                  </CardContent>
                </Card>
              </label>
            ))}
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
              <Wallet className="h-6 w-6" />
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
          <Button 
            onClick={handlePurchase} 
            className="w-full py-6" 
            size="lg"
            disabled={isProcessing || !user}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : !user ? (
              "Sign In to Purchase"
            ) : (
              "Complete Purchase"
            )}
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
