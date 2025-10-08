"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import type { UserRole, Passwords } from '@/lib/types';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export default function PasswordManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [roleToChange, setRoleToChange] = useState<UserRole | ''>('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [jefePassword, setJefePassword] = useState('');
  const [showJefePassword, setShowJefePassword] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setRoleToChange('');
    setNewPassword('');
    setConfirmPassword('');
    setJefePassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowJefePassword(false);
  };

  const handleChangePassword = () => {
    // Validations
    if (!roleToChange || !newPassword || !jefePassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Todos los campos son obligatorios.' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    const storedPasswords = localStorage.getItem('sotos_passwords');
    if (!storedPasswords) {
      toast({ variant: 'destructive', title: 'Error', description: 'Error al cargar las contraseñas del sistema.' });
      return;
    }

    const passwords: Passwords = JSON.parse(storedPasswords);

    // Verify Jefe's password
    if (passwords.jefe !== jefePassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'La contraseña de Jefe es incorrecta. No se puede realizar el cambio.' });
      return;
    }

    // Update the password
    const updatedPasswords = { ...passwords, [roleToChange]: newPassword };
    localStorage.setItem('sotos_passwords', JSON.stringify(updatedPasswords));

    // Trigger logout event for the affected role
    const passwordChangeEvent = {
      changedRole: roleToChange,
      timestamp: Date.now(),
    };
    localStorage.setItem('sotos_password_change_event', JSON.stringify(passwordChangeEvent));

    toast({ title: 'Éxito', description: `La contraseña para el rol '${roleToChange}' ha sido actualizada.` });

    // Reset form and close dialog
    resetForm();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <KeyRound className="mr-2 h-4 w-4" />
          Gestionar Contraseñas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Contraseñas</DialogTitle>
          <DialogDescription>
            Cambia la contraseña de cualquier rol. El rol afectado deberá iniciar sesión de nuevo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role-to-change">Rol a Modificar</Label>
            <Select value={roleToChange} onValueChange={(value: UserRole) => setRoleToChange(value)}>
              <SelectTrigger id="role-to-change">
                <SelectValue placeholder="Seleccionar rol..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mesero">Mesero</SelectItem>
                <SelectItem value="cocina">Cocina</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="jefe">Jefe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jefe-password">Tu Contraseña de Jefe (para confirmar)</Label>
            <div className="relative">
              <Input
                id="jefe-password"
                type={showJefePassword ? 'text' : 'password'}
                value={jefePassword}
                onChange={(e) => setJefePassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                onClick={() => setShowJefePassword(!showJefePassword)}
              >
                {showJefePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleChangePassword}>
            Cambiar Contraseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
