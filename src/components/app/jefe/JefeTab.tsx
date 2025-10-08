"use client";

import { useContext } from 'react';
import { AppContext } from '../AppContext';
import SalesReport from './SalesReport';
import OrderCard from '../shared/OrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import BroadcastMessage from './BroadcastMessage';
import PasswordManager from './PasswordManager';
import MenuManager from './MenuManager';

export default function JefeTab() {
  const { orders } = useContext(AppContext);
  
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.lastUpdated);
    const dateB = new Date(b.lastUpdated);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 mb-4">
        <BroadcastMessage />
        <PasswordManager />
      </div>
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="monitor">En Vivo</TabsTrigger>
          <TabsTrigger value="menu">Menú</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-6">
          <SalesReport orders={orders} />
        </TabsContent>
        <TabsContent value="monitor" className="mt-6">
          {sortedOrders.length > 0 ? (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed mt-8">
              No hay órdenes en el sistema.
            </div>
          )}
        </TabsContent>
        <TabsContent value="menu" className="mt-6">
            <MenuManager />
        </TabsContent>
      </Tabs>
    </>
  );
}