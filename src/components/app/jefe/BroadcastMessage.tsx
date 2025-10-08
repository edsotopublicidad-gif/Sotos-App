"use client";

import { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BroadcastMessage() {
  const { broadcastMessage } = useContext(AppContext);
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSend = () => {
    if (message.trim()) {
      broadcastMessage(message.trim());
      toast({
        title: 'Mensaje Enviado',
        description: 'Tu anuncio ha sido enviado a todo el personal.',
      });
      setMessage('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Megaphone className="mr-2 h-4 w-4" />
          Enviar Mensaje
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Anuncio a Todo el Personal</DialogTitle>
          <DialogDescription>
            El mensaje aparecerá como una ventana emergente para todos los roles activos y emitirá una notificación sonora.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="message">Mensaje</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu anuncio aquí..."
            className="mt-2 min-h-[120px]"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSend} disabled={!message.trim()}>
            Enviar Anuncio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
