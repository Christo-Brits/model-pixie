
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Apple, Wallet } from 'lucide-react';

interface PaymentMethodSelectProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
}

export function PaymentMethodSelect({ paymentMethod, setPaymentMethod }: PaymentMethodSelectProps) {
  return (
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
  );
}
