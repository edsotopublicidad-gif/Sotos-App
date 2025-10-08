"use client";

import { useState, useContext } from 'react';
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
import { NotificationContext } from '../AppContext';

interface LogoutConfirmationDialogProps {
    onConfirm: () => void;
}

export default function LogoutConfirmationDialog({ onConfirm }: LogoutConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const notificationContext = useContext(NotificationContext);

  const handleOpen = () => {
    notificationContext?.playLogoutNotification();
    setIsOpen(true);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
            id="logout-btn"
            variant="destructive"
            onClick={handleOpen}
        >
            Cerrar Sesión
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
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
