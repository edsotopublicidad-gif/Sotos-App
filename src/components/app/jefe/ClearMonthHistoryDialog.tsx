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

interface ClearMonthHistoryDialogProps {
  monthKey: string;
  monthName: string;
}

export default function ClearMonthHistoryDialog({ monthKey, monthName }: ClearMonthHistoryDialogProps) {
  const { clearArchivedOrdersByMonth } = useContext(AppContext);
  const [pin, setPin] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirm = () => {
    if (pin === CLEAR_PIN) {
      clearArchivedOrdersByMonth(monthKey);
      setIsDialogOpen(false);
      setPin('');
    } else {
      toast({
        variant: "destructive",
        title: "PIN Incorrecto",
        description: "No se pudo limpiar el historial del mes. Inténtalo de nuevo.",
      });
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
    }
  };

  const openDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={openDialog}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar historial de {monthName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente todos los registros de ventas para <strong>{monthName}</strong>. Esta acción no se puede deshacer. Ingresa el PIN de 4 dígitos para confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
            <Label htmlFor="pin-month" className="text-center block">PIN de Confirmación</Label>
            <Input 
                id="pin-month"
                type="password"
                value={pin}
                onChange={handlePinChange}
                placeholder="****"
                maxLength={4}
                className="w-32 mx-auto text-center text-2xl tracking-[0.5em]"
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setPin(''); setIsDialogOpen(false); }}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pin.length !== 4}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
