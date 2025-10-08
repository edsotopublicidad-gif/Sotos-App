"use client";

import { useState, useContext } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppContext } from '../AppContext';
import { useToast } from "@/hooks/use-toast";
import type { Passwords, UserRole } from "@/lib/types";

export default function FinalizeKitchenServiceDialog() {
  const { clearKitchenCompletedOrders } = useContext(AppContext);
  const [password, setPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirm = () => {
    const storedPasswords = localStorage.getItem('sotos_passwords');
    if (!storedPasswords) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las contraseñas." });
      return;
    }
    const passwords: Passwords = JSON.parse(storedPasswords);
    const correctPassword = passwords['cocina' as UserRole];
    
    if (password === correctPassword) {
      clearKitchenCompletedOrders();
      setIsDialogOpen(false);
      setPassword('');
    } else {
      toast({
        variant: "destructive",
        title: "Contraseña Incorrecta",
        description: "No se pudo finalizar el servicio. Inténtalo de nuevo.",
      });
    }
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Finalizar Servicio del Día</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de finalizar el servicio?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción limpiará tu historial de pedidos preparados para el próximo turno. Los pedidos permanecerán en el reporte del jefe. Ingresa la contraseña de cocina para confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
            <Label htmlFor="password">Contraseña de Cocina</Label>
            <Input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPassword('')}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirmar Finalización</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
