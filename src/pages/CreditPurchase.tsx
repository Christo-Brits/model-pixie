
import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { toast } from '@/components/ui/sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { 
  createCheckoutSession, 
  handleCheckoutResult, 
  creditPackages 
} from '@/services/paymentService';
import { CreditPackageSelect } from '@/components/credits/CreditPackageSelect';
import { PaymentMethodSelect } from '@/components/credits/PaymentMethodSelect';
import { PurchaseButton } from '@/components/credits/PurchaseButton';
import { CreditBalanceDisplay } from '@/components/credits/CreditBalanceDisplay';

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
            <CreditBalanceDisplay 
              credits={credits}
              creditsLoading={creditsLoading}
              onRefresh={refetchCredits}
            />
          )}
        </div>
        
        {/* Credit packages */}
        <CreditPackageSelect
          creditPackages={creditPackages}
          selectedPackage={selectedPackage}
          setSelectedPackage={setSelectedPackage}
        />
        
        {/* Payment Methods */}
        <PaymentMethodSelect 
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
        />
        
        {/* Purchase button */}
        <PurchaseButton 
          isProcessing={isProcessing}
          user={user}
          onPurchase={handlePurchase}
        />
        
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
