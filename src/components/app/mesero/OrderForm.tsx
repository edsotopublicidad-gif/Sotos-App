"use client";

import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../AppContext';
import type { OrderItem, Order, PaymentMethod, UserRole, MenuItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, MinusCircle, Trash2 } from 'lucide-react';
import PaymentModal from './PaymentModal';
import { useToast } from "@/hooks/use-toast"

interface OrderFormProps {
  existingOrder?: Order | null;
  onOrderSubmit: () => void;
  activeTab: 'mesero' | 'delivery';
}

export default function OrderForm({ existingOrder, onOrderSubmit, activeTab }: OrderFormProps) {
  const { role, addOrder, updateOrder, menuItems } = useContext(AppContext);
  
  const isDeliveryContext = activeTab === 'delivery';

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'mesa' | 'delivery' | 'pickup'>(isDeliveryContext ? 'delivery' : 'mesa');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (existingOrder) {
      setCurrentOrder(existingOrder.items);
      setOrderType(existingOrder.type);
      setTableNumber(existingOrder.table || '');
      setCustomerName(existingOrder.customerName || '');
      setNotes(existingOrder.notes || '');
    } else {
      resetForm();
    }
  }, [existingOrder, isDeliveryContext]);

  const resetForm = () => {
    setCurrentOrder([]);
    setOrderType(isDeliveryContext ? 'delivery' : 'mesa');
    setTableNumber('');
    setCustomerName('');
    setNotes('');
  }

  const addToOrder = (menuItem: MenuItem) => {
    setCurrentOrder(prevOrder => {
      const existingItem = prevOrder.find(item => item.id === menuItem.id);
      if (existingItem) {
        return prevOrder.map(item =>
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevOrder, { ...menuItem, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCurrentOrder(prevOrder => prevOrder.filter(item => item.id !== itemId));
    } else {
      setCurrentOrder(prevOrder =>
        prevOrder.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeFromOrder = (itemId: string) => {
    setCurrentOrder(prevOrder => prevOrder.filter(item => item.id !== itemId));
  }

  const handleTableNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Prevent non-digit characters
    if (!/^\d*$/.test(value)) {
      return;
    }
    // Limit to 2 digits and ensure value is between 1 and 99
    if (value === '' || (parseInt(value) > 0 && parseInt(value) < 100 && value.length <= 2)) {
      setTableNumber(value);
    }
  };

  const total = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const validateOrder = () => {
    if (currentOrder.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'La orden está vacía.' });
      return false;
    }
    if (orderType === 'mesa' && !tableNumber) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, ingresa el número de mesa.' });
      return false;
    }
    if ((orderType === 'pickup' || orderType === 'delivery') && !customerName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, ingresa el nombre del cliente.' });
      return false;
    }
    return true;
  }
  
  const getCreatorInfo = () => {
      if (role === 'delivery' || activeTab === 'delivery') return { waiterId: 'delivery1', waiterName: 'Repartidor' };
      if (role === 'jefe') {
         // When Jefe creates, decide based on order type
         if(orderType === 'delivery') return { waiterId: 'delivery1', waiterName: 'Repartidor' };
         return { waiterId: 'mesero1', waiterName: 'Mesero' }; // Default to mesero
      }
      return { waiterId: 'mesero1', waiterName: 'Mesero' };
  }

  const handleSendToKitchen = () => {
    if (!validateOrder()) return;

    const orderPayload = {
      ...getCreatorInfo(),
      type: orderType,
      table: orderType === 'mesa' ? tableNumber : undefined,
      customerName: (orderType === 'pickup' || orderType === 'delivery') ? customerName : undefined,
      items: currentOrder,
      total,
      notes: notes.trim() || undefined,
    };
    
    if (existingOrder) {
      updateOrder(existingOrder.id, {
        ...orderPayload,
        status: 'pendiente', // Even if updated, it goes back to kitchen queue
      });
      toast({ title: 'Éxito', description: `Orden actualizada correctamente.` });
    } else {
      addOrder({
        ...orderPayload,
        status: 'pendiente',
      });
      toast({ title: 'Éxito', description: `Orden enviada a la cocina.` });
    }
    
    onOrderSubmit();
    resetForm();
  }

  const handleOpenPaymentModal = () => {
    if (!validateOrder()) return;
    setIsPaymentModalOpen(true);
  }

  const handlePaymentConfirm = (paymentMethod: PaymentMethod, reference?: string) => {
    if (!validateOrder()) {
      setIsPaymentModalOpen(false);
      return;
    }

    const orderPayload = {
      ...getCreatorInfo(),
      type: orderType,
      table: orderType === 'mesa' ? tableNumber : undefined,
      customerName: (orderType === 'pickup' || orderType === 'delivery') ? customerName : undefined,
      items: currentOrder,
      total,
      status: 'pagada' as const, // This will be interpreted by AppContext
      paymentMethod,
      paymentReference: reference,
      notes: notes.trim() || undefined,
    };

    if (existingOrder) {
      updateOrder(existingOrder.id, orderPayload);
      toast({ title: 'Éxito', description: `Orden pagada correctamente.` });
    } else {
      addOrder(orderPayload);
      toast({ title: 'Éxito', description: `Orden pagada y enviada a cocina.` });
    }
    
    setIsPaymentModalOpen(false);
    onOrderSubmit();
    resetForm();
  }

  const sortedMenuItems = [...menuItems]
    .filter(item => !item.isDisabled)
    .sort((a, b) => a.order - b.order);
  
  const showSendToKitchenButton = orderType === 'mesa' && !isDeliveryContext;
  const isPayAndSendOnly = (orderType === 'pickup' && !isDeliveryContext) || (orderType === 'delivery' && !existingOrder) || (orderType === 'pickup' && isDeliveryContext);

  return (
    <>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        total={total}
        onConfirm={handlePaymentConfirm}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">Menú</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sortedMenuItems.map(item => (
              <Card key={item.id} onClick={() => addToOrder(item)} className="cursor-pointer hover:shadow-md hover:border-primary bg-transparent hover:bg-accent transition-all rounded-lg">
                <CardContent className="p-3 text-center flex flex-col justify-center h-full">
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-xs font-bold">${item.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Card className="bg-card shadow-none border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Orden Actual</CardTitle>
            </div>
            <CardDescription>Revisa los productos antes de enviar la orden.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentOrder.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center w-32">Cant.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrder.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-4 w-4"/></Button>
                            <Input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                                className="h-8 w-12 text-center p-1"
                                min="0"
                            />
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-4 w-4"/></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromOrder(item.id)}><Trash2 className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground italic py-4">La orden está vacía.</p>
            )}

            <div className="space-y-4">
               
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order-type">Tipo de Pedido</Label>
                  <Select value={orderType} onValueChange={(v: 'mesa' | 'delivery' | 'pickup') => setOrderType(v)}>
                    <SelectTrigger id="order-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!isDeliveryContext && <SelectItem value="mesa">Para Mesa</SelectItem>}
                      {isDeliveryContext && <SelectItem value="delivery">Delivery</SelectItem>}
                      <SelectItem value="pickup">Pick Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {orderType === 'mesa' && !isDeliveryContext && (
                  <div>
                    <Label htmlFor="table-number">Número de Mesa</Label>
                    <Input
                      id="table-number"
                      type="text"
                      inputMode="numeric"
                      pattern="[1-9][0-9]?"
                      maxLength={2}
                      placeholder="Ej: 5"
                      value={tableNumber}
                      onChange={handleTableNumberChange}
                    />
                  </div>
                )}
                {(orderType === 'pickup' || orderType === 'delivery') && (
                  <div>
                    <Label htmlFor="customer-name">Nombre del Cliente</Label>
                    <Input
                      id="customer-name"
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="order-notes">Notas (opcional)</Label>
                <Textarea 
                  id="order-notes"
                  placeholder="Ej: Sin cebolla, con extra de queso..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center text-lg font-bold p-4 bg-background rounded-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col gap-2">
                {showSendToKitchenButton && !isPayAndSendOnly && (
                    <Button onClick={handleSendToKitchen} className="w-full bg-primary hover:bg-primary/90">
                        {existingOrder ? 'Actualizar Orden' : 'Enviar a Cocina'}
                    </Button>
                )}
                
                {!isPayAndSendOnly && <Button onClick={handleOpenPaymentModal} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    {showSendToKitchenButton ? 'Confirmar Pago y Enviar' : (existingOrder ? 'Pagar Orden' : 'Pagar y Enviar a Cocina')}
                </Button>}

                {isPayAndSendOnly && <Button onClick={handleOpenPaymentModal} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Pagar y Enviar a Cocina
                </Button>}

                { (existingOrder && (existingOrder.type === 'pickup' || existingOrder.type === 'delivery')) && 
                    <Button onClick={handleOpenPaymentModal} className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Pagar y Enviar a Cocina
                    </Button>
                }
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
