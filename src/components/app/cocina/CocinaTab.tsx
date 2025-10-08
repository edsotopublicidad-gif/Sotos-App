"use client";

import { useContext } from 'react';
import { AppContext } from '../AppContext';
import OrderCard from '../shared/OrderCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FinalizeKitchenServiceDialog from './FinalizeKitchenServiceDialog';
import { Separator } from '@/components/ui/separator';

export default function CocinaTab() {
  const { orders } = useContext(AppContext);

  const receivedOrders = orders.filter(order =>
    order.status === 'pendiente'
  ).sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());

  const inProcessOrders = orders.filter(order =>
    order.status === 'en_proceso'
  ).sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  const completedOrders = orders.filter(order =>
    ['lista_para_entrega', 'en_camino', 'entregada', 'pagada'].includes(order.status)
  ).sort((a,b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

  const todayStr = new Date().toLocaleDateString('es-VE', {day: 'numeric', month: 'numeric', year: 'numeric'});

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Órdenes Recibidas</h2>
        {receivedOrders.length > 0 ? (
          <ScrollArea className="h-72 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {receivedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed mt-8">
            No hay nuevas órdenes por aceptar.
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Órdenes en Proceso</h2>
        {inProcessOrders.length > 0 ? (
          <ScrollArea className="h-72 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProcessOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed mt-8">
            No hay órdenes preparándose.
          </div>
        )}
      </div>

      <Separator />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="historial">
          <AccordionTrigger>
            <h2 className="text-2xl font-semibold font-headline">Historial de Hoy ({todayStr})</h2>
          </AccordionTrigger>
          <AccordionContent className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <p className="text-muted-foreground">Pedidos que has marcado como listos hoy.</p>
                {completedOrders.length > 0 && <FinalizeKitchenServiceDialog />}
            </div>
            {completedOrders.length > 0 ? (
              <ScrollArea className="h-[60vh] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed mt-8">
                Aún no se ha preparado ninguna orden hoy.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
