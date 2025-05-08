
import React from 'react';
import { RadioGroup } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditPackage } from '@/services/paymentService';

interface CreditPackageSelectProps {
  creditPackages: CreditPackage[];
  selectedPackage: string;
  setSelectedPackage: (packageId: string) => void;
}

export function CreditPackageSelect({ 
  creditPackages, 
  selectedPackage, 
  setSelectedPackage 
}: CreditPackageSelectProps) {
  return (
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
                  <input 
                    type="radio"
                    className="sr-only"
                    name="creditPackage"
                    id={pkg.id}
                    value={pkg.id}
                    checked={selectedPackage === pkg.id}
                    onChange={() => setSelectedPackage(pkg.id)}
                  />
                  <div className={`w-4 h-4 rounded-full border ${
                    selectedPackage === pkg.id 
                      ? "border-primary bg-primary/10" 
                      : "border-gray-400"
                  }`}>
                    {selectedPackage === pkg.id && (
                      <div className="w-2 h-2 rounded-full bg-primary m-[3px]"></div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
