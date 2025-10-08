"use client";

import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';

export default function BroadcastViewer() {
  const { role, broadcastData, clearBroadcast } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (broadcastData && role !== 'jefe') {
      setIsOpen(true);
    }
  }, [broadcastData, role]);

  const handleClose = () => {
    setIsOpen(false);
    clearBroadcast();
  };
  
  if (!isOpen || role === 'jefe' || !broadcastData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <Megaphone className="mr-2 h-6 w-6 text-primary" />
            Anuncio del Jefe
          </DialogTitle>
          <DialogDescription className="text-base text-foreground py-4">
            {broadcastData.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={handleClose}>Entendido</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
