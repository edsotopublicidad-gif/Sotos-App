"use client";

import { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from 'lucide-react';

const CLEAR_PIN = "1990";

export default function ClearHistoryDialog() {
  const { clearArchivedOrders, archivedOrders } = useContext(AppContext);
  const [pin, setPin] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirm = () => {
    if (pin === CLEAR_PIN) {
      clearArchivedOrders();
      setIsDialogOpen(false);
      setPin('');
    } else {
      toast({
        variant: "destructive",
        title: "PIN Incorrecto",
        description: "No se pudo limpiar el historial. Inténtalo de nuevo.",
      });
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
    }
  };
  
  if (archivedOrders.length === 0) {
    return null;
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Historial
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de limpiar el historial?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente todos los registros de ventas archivados. Esta acción no se puede deshacer. Ingresa el PIN de 4 dígitos para confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
            <Label htmlFor="pin" className="text-center block">PIN de Confirmación</Label>
            <Input 
                id="pin"
                type="password"
                value={pin}
                onChange={handlePinChange}
                placeholder="****"
                maxLength={4}
                className="w-32 mx-auto text-center text-2xl tracking-[0.5em]"
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPin('')}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pin.length !== 4}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
