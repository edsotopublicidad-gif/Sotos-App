"use client";

import { useState, useContext } from 'react';
import OrderForm from '../mesero/OrderForm';
import OrderCard from '../shared/OrderCard';
import { AppContext } from '../AppContext';
import { Separator } from '@/components/ui/separator';
import type { Order } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import FinalizeDeliveryServiceDialog from './FinalizeDeliveryServiceDialog';

export default function DeliveryTab() {
  const { role, orders, getDeliveryOrders } = useContext(AppContext);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Simulating a delivery person ID. Jefe can see delivery1's orders.
  const myOrders = role === 'jefe' 
    ? orders.filter(o => o.waiterId === 'delivery1') 
    : getDeliveryOrders('delivery1');

  const handleEdit = (orderId: string) => {
    const orderToEdit = orders.find(o => o.id === orderId);
    if (orderToEdit) {
      setEditingOrder(orderToEdit);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleFormSubmit = () => {
    setEditingOrder(null);
  }

  const pendingOrders = myOrders.filter(o => !['entregada', 'cancelada', 'pagada'].includes(o.status)).sort((a,b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  
  const paidOrders = myOrders.filter(o => o.status === 'pagada').sort((a,b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

  const getOrderTitle = (order: Order) => {
    switch(order.type) {
        case 'delivery':
            return `Delivery: ${order.customerName}`;
        case 'pickup':
            return `Pick Up: ${order.customerName}`;
        default:
            return 'Orden';
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline">
          {editingOrder ? `Editando Orden (${getOrderTitle(editingOrder)})` : 'Crear Nueva Orden de Delivery'}
        </h2>
        <OrderForm existingOrder={editingOrder} onOrderSubmit={handleFormSubmit} activeTab='delivery' />
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Órdenes en Proceso</h2>
        {pendingOrders.length > 0 ? (
          <ScrollArea className="h-96 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} onEdit={handleEdit} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed">
            No tienes órdenes en proceso.
          </div>
        )}
      </div>

      <Separator />

       <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold font-headline">Entregas de Hoy ({paidOrders.length} órdenes)</h2>
            {paidOrders.length > 0 && <FinalizeDeliveryServiceDialog />}
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
                          {new Date(order.timestamp).toLocaleDateString('es-VE', {day: '2-digit', month: '2-digit'})} {' '}
                          {new Date(order.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
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
            Aún no has completado ninguna entrega hoy.
          </div>
        )}
      </div>
    </div>
  );
}
