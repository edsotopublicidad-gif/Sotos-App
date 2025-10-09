"use client";

import { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaymentMethod } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AppContext } from '../AppContext';

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  total: number;
  onConfirm: (method: PaymentMethod, reference?: string) => void;
}

export default function PaymentModal({ isOpen, onOpenChange, total, onConfirm }: PaymentModalProps) {
  const { role, playPaymentNotification } = useContext(AppContext);
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [reference, setReference] = useState('');
  const { toast } = useToast();

  const needsReference = method === 'pago_movil' || method === 'transferencia';
  const isConfirmDisabled = !method || (needsReference && reference.length !== 4);

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setMethod('');
      setReference('');
    }
  }, [isOpen]);

  const handleConfirmClick = () => {
    if (isConfirmDisabled) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Por favor, complete la información de pago.",
      })
      return;
    };
    if(role !== 'jefe') {
        playPaymentNotification();
    }
    onConfirm(method as PaymentMethod, reference);
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numeric values and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setReference(value);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Pago</DialogTitle>
          <DialogDescription>
            Seleccione un método de pago para registrar la orden como pagada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Monto Total</p>
            <p className="text-4xl font-bold">${total.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de Pago</Label>
            <Select value={method} onValueChange={(value: PaymentMethod) => setMethod(value)}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Seleccione un método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="efectivo">Efectivo Bs.</SelectItem>
                <SelectItem value="divisas">Divisas</SelectItem>
                <SelectItem value="nfc">NFC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {needsReference && (
            <div className="space-y-2">
              <Label htmlFor="payment-reference">Referencia (Últimos 4 dígitos)</Label>
              <Input
                id="payment-reference"
                type="text"
                value={reference}
                onChange={handleReferenceChange}
                placeholder="1234"
                maxLength={4}
                pattern="\d{4}"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirmClick} disabled={isConfirmDisabled}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
