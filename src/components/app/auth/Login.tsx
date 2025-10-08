"use client";

import { useState, useContext, useEffect } from 'react';
import Image from 'next/image';
import { AppContext } from '@/components/app/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserRole } from '@/lib/types';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import type { Passwords } from '@/lib/types';

export default function Login() {
  const { setRole } = useContext(AppContext);
  const [selectedRole, setSelectedRole] = useState<UserRole>('mesero');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState<Passwords | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Passwords are now loaded from localStorage
    const storedPasswords = localStorage.getItem('sotos_passwords');
    if (storedPasswords) {
      setPasswords(JSON.parse(storedPasswords));
    }
  }, []);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords && passwords[selectedRole] === password) {
      setRole(selectedRole);
    } else {
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: "Contraseña incorrecta. Inténtalo de nuevo.",
      })
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Card className="w-full max-w-sm mx-4 bg-card/90">
        <CardHeader className="text-center items-center">
            <Image src="https://i.ibb.co/1YDd8bvR/Sotos-Fast-Food-Drinks.png" alt="Soto's Logo" width={100} height={100} priority />
          <CardTitle className="text-2xl font-bold font-headline mt-4">Bienvenido a Soto's Foods</CardTitle>
          <CardDescription className="font-semibold">Selecciona tu rol e ingresa la contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-role" className="font-semibold">¿Quién Eres?</Label>
              <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mesero">Mesero</SelectItem>
                  <SelectItem value="cocina">Cocinera</SelectItem>
                  <SelectItem value="delivery">Repartidor</SelectItem>
                  <SelectItem value="jefe">Jefe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={!passwords}>
              {passwords ? 'Entrar' : 'Cargando...'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
