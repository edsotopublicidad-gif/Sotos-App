"use client";

import { useContext, useState, useEffect }
from 'react';
import { AppContext } from '../AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { MenuItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export default function MenuManager() {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, moveMenuItem, toggleMenuItemAvailability } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (newItemId) {
      const timer = setTimeout(() => {
        setNewItemId(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [newItemId]);


  const openDialog = (item: MenuItem | null) => {
    setEditingItem(item);
    if (item) {
      setItemName(item.name);
      setItemPrice(item.price.toString());
    } else {
      setItemName('');
      setItemPrice('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const price = parseFloat(itemPrice);
    if (!itemName.trim() || isNaN(price) || price < 0) {
      toast({
        variant: "destructive",
        title: "Datos inválidos",
        description: "Por favor, ingresa un nombre y un precio válido.",
      });
      return;
    }

    if (editingItem) {
      updateMenuItem(editingItem.id, { name: itemName.trim(), price });
    } else {
      const newItem = addMenuItem({ name: itemName.trim(), price });
      if (newItem) {
        setNewItemId(newItem.id);
      }
    }
    setIsDialogOpen(false);
  };
  
  const handleMoveItem = (itemId: string, direction: 'up' | 'down') => {
    moveMenuItem(itemId, direction);
    setHighlightedItemId(itemId);
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 2000);
  };

  const sortedMenuItems = [...menuItems].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold font-headline">Gestionar Productos del Menú</h2>
        <Button onClick={() => openDialog(null)} className="bg-green-600 hover:bg-green-700 text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Producto
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Orden</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="w-32 text-right">Precio</TableHead>
              <TableHead className="w-28 text-center">Disponible</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMenuItems.length > 0 ? (
              sortedMenuItems.map((item, index) => (
                <TableRow 
                    key={item.id}
                    className={cn(
                        'transition-colors',
                        highlightedItemId === item.id ? 'bg-destructive/20' : 'duration-[2000ms]',
                        newItemId === item.id ? 'bg-green-600/20' : 'duration-[4000ms]',
                        item.isDisabled && 'opacity-50'
                    )}
                >
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveItem(item.id, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveItem(item.id, 'down')} disabled={index === sortedMenuItems.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className={cn("font-bold", item.isDisabled && "line-through")}>{item.name}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                        checked={!item.isDisabled}
                        onCheckedChange={() => toggleMenuItemAvailability(item.id)}
                        className={cn(
                            !item.isDisabled ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-destructive"
                        )}
                        aria-label="Disponibilidad del producto"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openDialog(item)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro de eliminar este producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El producto "{item.name}" será eliminado permanentemente del menú.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMenuItem(item.id)}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No hay productos en el menú.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Modifica los detalles del producto.' : 'Añade un nuevo producto al menú.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Nombre del Producto</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ej: Hamburguesa Especial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Precio ($)</Label>
              <Input
                id="item-price"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="Ej: 12.50"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
