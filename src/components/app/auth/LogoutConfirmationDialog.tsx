"use client";

import { useState } from 'react';
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
import { LogOut } from 'lucide-react';

interface LogoutConfirmationDialogProps {
    onConfirm: () => void;
}

export default function LogoutConfirmationDialog({ onConfirm }: LogoutConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirmLogout = () => {
    onConfirm();
    setIsOpen(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
            variant="destructive"
            size="sm"
        >
            <LogOut className="mr-2 h-4 w-4" />
            Salir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de que quieres salir?</AlertDialogTitle>
          <AlertDialogDescription>
            Tu sesión actual se cerrará y deberás volver a ingresar tu contraseña para acceder.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmLogout}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
