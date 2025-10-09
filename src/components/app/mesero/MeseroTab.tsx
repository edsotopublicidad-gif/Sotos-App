"use client";

import { useState, useContext } from 'react';
import OrderForm from './OrderForm';
import OrderCard from '../shared/OrderCard';
import { AppContext } from '../AppContext';
import { Separator } from '@/components/ui/separator';
import type { Order } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import FinalizeServiceDialog from './FinalizeServiceDialog';
import ClearCancelledDialog from './ClearCancelledDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function MeseroTab() {
  const { role, orders, getWaiterOrders, isLoadingOrders } = useContext(AppContext);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Simulating a waiter ID for 'mesero' role. Jefe can see mesero1's orders.
  const myOrders = role === 'jefe' 
    ? (orders || []).filter(o => o.waiterId === 'mesero1') 
    : getWaiterOrders('mesero1');

  const handleEdit = (orderId: string) => {
    if (!orders) return;
    const orderToEdit = orders.find(o => o.id === orderId);
    if (orderToEdit) {
      setEditingOrder(orderToEdit);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleFormSubmit = () => {
    setEditingOrder(null);
  }

  // "En proceso" are orders that are not yet delivered, cancelled, or fully paid.
  const pendingOrders = myOrders.filter(o => !['entregada', 'cancelada', 'pagada'].includes(o.status)).sort((a,b) => b.lastUpdated.toMillis() - a.lastUpdated.toMillis());
  
  // "Entregadas" are delivered but not yet paid.
  const deliveredOrders = myOrders.filter(o => o.status === 'entregada' && !o.isPaid).sort((a,b) => b.lastUpdated.toMillis() - a.lastUpdated.toMillis());
  
  // "Pagadas" are fully completed orders (delivered and paid).
  const paidOrders = myOrders.filter(o => o.status === 'pagada').sort((a,b) => b.lastUpdated.toMillis() - a.lastUpdated.toMillis());
  
  // "Canceladas" are orders that have been cancelled.
  const cancelledOrders = myOrders.filter(o => o.status === 'cancelada').sort((a,b) => b.lastUpdated.toMillis() - a.lastUpdated.toMillis());

  const getOrderTitle = (order: Order) => {
    switch(order.type) {
        case 'mesa':
            return `Mesa #${order.table}`;
        case 'delivery':
            return `Delivery: ${order.customerName}`;
        case 'pickup':
            return `Pick Up: ${order.customerName}`;
        default:
            return 'Orden';
    }
  }
  
  const OrderList = ({ orders, onEdit }: { orders: Order[], onEdit?: (id:string) => void }) => {
    if (isLoadingOrders) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        )
    }
    if(orders.length === 0) {
        return <div className="text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed">No hay órdenes en esta categoría.</div>;
    }
    return (
        <ScrollArea className="h-96 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} onEdit={onEdit} />
                ))}
            </div>
        </ScrollArea>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline">
          {editingOrder ? `Editando Orden (${getOrderTitle(editingOrder)})` : 'Crear Nueva Orden'}
        </h2>
        <OrderForm existingOrder={editingOrder} onOrderSubmit={handleFormSubmit} activeTab='mesero' />
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Órdenes en Proceso</h2>
        <OrderList orders={pendingOrders} onEdit={handleEdit} />
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Órdenes Entregadas (Pendiente de Pago)</h2>
        <OrderList orders={deliveredOrders} onEdit={handleEdit} />
      </div>

      <Separator />

       <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold font-headline">Hoy Vendiste ({paidOrders.length} órdenes)</h2>
            {paidOrders.length > 0 && <FinalizeServiceDialog />}
        </div>
        {paidOrders.length > 0 ? (
          <ScrollArea className="h-96 pr-4">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {paidOrders.map(order => (
                <AccordionItem value={order.id} key={order.id} className="border-b-0">
                  <AccordionTrigger className="bg-muted hover:bg-muted/90 px-4 rounded-lg flex justify-between items-center w-full data-[state=open]:rounded-b-none">
                      <div className="flex items-center gap-4 text-sm">
                        <span>{getOrderTitle(order)}</span>
                        <span className="text-muted-foreground">
                          {new Date(order.timestamp.toMillis()).toLocaleDateString('es-VE', {day: '2-digit', month: '2-digit'})} {' '}
                          {new Date(order.timestamp.toMillis()).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="font-bold text-sm">${order.total.toFixed(2)}</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                    <ul className="space-y-1 text-sm list-disc list-inside mb-3">
                        {order.items.map(item => (
                            <li key={item.id}>{item.name} x{item.quantity}</li>
                        ))}
                    </ul>
                    <Badge variant="secondary">
                        Pagado con: {order.paymentMethod?.replace('_', ' ')} {order.paymentReference && `(Ref: ...${order.paymentReference})`}
                    </Badge>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed">
            Aún no has completado ninguna venta hoy.
          </div>
        )}
      </div>

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold font-headline">Órdenes Canceladas Hoy ({cancelledOrders.length} órdenes)</h2>
            {cancelledOrders.length > 0 && <ClearCancelledDialog />}
        </div>
        {cancelledOrders.length > 0 ? (
          <ScrollArea className="h-72 pr-4">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {cancelledOrders.map(order => (
                <AccordionItem value={order.id} key={order.id} className="border-b-0">
                  <AccordionTrigger className="bg-destructive/10 hover:bg-destructive/20 px-4 rounded-lg flex justify-between items-center w-full data-[state=open]:rounded-b-none">
                      <div className="flex items-center gap-4 text-sm">
                        <span>{getOrderTitle(order)}</span>
                        <span className="text-muted-foreground">
                          {new Date(order.timestamp.toMillis()).toLocaleDateString('es-VE', {day: '2-digit', month: '2-digit'})} {' '}
                          {new Date(order.timestamp.toMillis()).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-destructive">${order.total.toFixed(2)}</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
                    <ul className="space-y-1 text-sm list-disc list-inside">
                        {order.items.map(item => (
                            <li key={item.id}>{item.name} x{item.quantity}</li>
                        ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed">
            No has cancelado ninguna orden hoy.
          </div>
        )}
      </div>

    </div>
  );
}
