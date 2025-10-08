"use client";

import { useState } from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useContext, useMemo } from 'react';
import { AppContext } from '../AppContext';
import { format, startOfWeek, getWeekOfMonth, getMonth, getYear, parseISO, isDate } from 'date-fns';
import { es } from 'date-fns/locale';
import ClearHistoryDialog from './ClearHistoryDialog';
import ClearMonthHistoryDialog from './ClearMonthHistoryDialog';
import { cn } from '@/lib/utils';

interface SalesReportProps {
  orders: Order[];
}

const getOrderIdentifier = (order: Order) => {
    switch (order.type) {
        case 'mesa':
            return `Mesa ${order.table}`;
        case 'delivery':
            return `Delivery (${order.customerName})`;
        case 'pickup':
            return `Pick Up (${order.customerName})`;
        default:
            return 'Orden';
    }
}

// Helper to format date into a readable string like "Lunes 27 de Mayo"
const formatDate = (date: Date) => {
    if (!isDate(date) || isNaN(date.getTime())) {
        return "Fecha inválida";
    }
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
};

const getSortableDate = (date: Date | string) => {
  const d = isDate(date) ? date : parseISO(date as string);
  return isDate(d) && !isNaN(d.getTime()) ? d : new Date(0);
}

export default function SalesReport({ orders }: SalesReportProps) {
  const { archivedOrders, archiveTodaysOrders } = useContext(AppContext);

  // Memoize all paid orders (active + archived)
  const allPaidOrders = useMemo(() => {
    const activePaid = orders.filter(o => o.status === 'pagada' || (o.isPaid && ['entregada', 'lista_para_entrega'].includes(o.status)));
    const allOrders = [...activePaid, ...archivedOrders];
    // Deduplicate orders in case they exist in both arrays during transition
    const uniqueOrders = allOrders.filter((order, index, self) =>
        index === self.findIndex((o) => o.id === order.id)
    );
    return uniqueOrders.map(o => ({...o, lastUpdated: getSortableDate(o.lastUpdated)}));
  }, [orders, archivedOrders]);


  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfThisWeek = startOfWeek(today, { locale: es });

  // Daily Sales: from active orders of today
  const dailySales = orders
    .filter(o => {
        const orderDate = getSortableDate(o.lastUpdated);
        return (o.status === 'pagada' || (o.isPaid && ['entregada', 'lista_para_entrega'].includes(o.status))) && orderDate >= today;
    });
  const dailyTotal = dailySales.reduce((sum, order) => sum + order.total, 0);

  // Weekly Sales: from all paid orders of the current week
  const weeklySales = allPaidOrders
    .filter(o => getSortableDate(o.lastUpdated) >= startOfThisWeek);
  const weeklyTotal = weeklySales.reduce((sum, order) => sum + order.total, 0);


  // Historical Sales Data Processing
  const historicalData = useMemo(() => {
    const data: { [key: string]: { [key: string]: { [key: string]: { total: number, orders: Order[] } } } } = {};
    
    allPaidOrders.forEach(order => {
      const date = order.lastUpdated;
      if (!isDate(date) || isNaN(date.getTime())) return;
      
      const year = getYear(date);
      const month = getMonth(date);
      const weekOfMonth = `Semana ${getWeekOfMonth(date, { locale: es })}`;
      const dayKey = formatDate(date);

      if (dayKey === "Fecha inválida") return;

      const monthYearKey = `${year}-${month}`;

      if (!data[monthYearKey]) {
        data[monthYearKey] = {};
      }
      if (!data[monthYearKey][weekOfMonth]) {
        data[monthYearKey][weekOfMonth] = {};
      }
      if (!data[monthYearKey][weekOfMonth][dayKey]) {
        data[monthYearKey][weekOfMonth][dayKey] = { total: 0, orders: [] };
      }

      data[monthYearKey][weekOfMonth][dayKey].total += order.total;
      data[monthYearKey][weekOfMonth][dayKey].orders.push(order);
    });

    return Object.entries(data).map(([monthYearKey, weeks]) => {
        const [year, month] = monthYearKey.split('-').map(Number);
        const monthName = format(new Date(year, month), 'MMMM', { locale: es });
        const monthTotal = Object.values(weeks).reduce((acc, days) => acc + Object.values(days).reduce((dAcc, {total}) => dAcc + total, 0), 0);
        return {
            monthYearKey,
            monthName,
            year: year.toString(),
            monthTotal,
            weeks: Object.entries(weeks).map(([weekName, days]) => {
                const weekTotal = Object.values(days).reduce((acc, {total}) => acc + total, 0);
                 const sortedDays = Object.entries(days)
                    .map(([dayName, {total, orders}]) => ({ dayName, total, orders: orders.sort((a,b) => getSortableDate(b.lastUpdated).getTime() - getSortableDate(a.lastUpdated).getTime()) }))
                    .sort((a, b) => {
                        const dateA = a.orders.length > 0 ? getSortableDate(a.orders[0].lastUpdated) : new Date(0);
                        const dateB = b.orders.length > 0 ? getSortableDate(b.orders[0].lastUpdated) : new Date(0);
                        return dateB.getTime() - dateA.getTime();
                    });
                return { weekName, weekTotal, days: sortedDays };
            }).sort((a,b) => parseInt(b.weekName.split(' ')[1]) - parseInt(a.weekName.split(' ')[1]))
        }
    }).sort((a, b) => {
        const [yearA, monthA] = a.monthYearKey.split('-').map(Number);
        const [yearB, monthB] = b.monthYearKey.split('-').map(Number);
        return new Date(yearB, monthB).getTime() - new Date(yearA, monthA).getTime();
    });

  }, [allPaidOrders]);

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold font-headline">Reporte de Ventas</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Archivar Ventas del Día
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Archivar ventas del día?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción moverá todas las órdenes pagadas y canceladas de hoy al archivo histórico y las limpiará de la vista activa. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={archiveTodaysOrders}>Confirmar y Archivar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Ventas del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${dailyTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{dailySales.length} órdenes</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">Ventas de la Semana</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">${weeklyTotal.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{weeklySales.length} órdenes</p>
            </CardContent>
        </Card>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold font-headline">Historial de Ventas</h3>
            <ClearHistoryDialog />
        </div>
        {historicalData.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {historicalData.map(({ monthYearKey, monthName, year, monthTotal, weeks }) => (
              <AccordionItem value={monthYearKey} key={monthYearKey} className="border rounded-lg bg-card">
                <div className="flex items-center w-full px-6">
                    <AccordionTrigger className="py-4 hover:no-underline flex-1 text-left">
                        <div className="flex justify-between w-full">
                            <span className="text-lg font-semibold capitalize">
                                {monthName.charAt(0).toUpperCase() + monthName.slice(1)} <span className="text-muted-foreground font-normal">{year}</span>
                            </span>
                        </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 pl-4">
                        <span className="text-lg font-bold">${monthTotal.toFixed(2)}</span>
                        <ClearMonthHistoryDialog monthKey={monthYearKey} monthName={`${monthName} ${year}`} />
                    </div>
                </div>
                <AccordionContent className="px-6 pb-4">
                   <Accordion type="multiple" className="w-full space-y-2">
                    {weeks.map(({ weekName, weekTotal, days }) => (
                        <AccordionItem value={`${monthYearKey}-${weekName}`} key={`${monthYearKey}-${weekName}`} className="border rounded-md">
                            <AccordionTrigger className="px-4 py-2 hover:no-underline text-base">
                                <div className="flex justify-between w-full">
                                    <span>{weekName}</span>
                                    <span className="font-bold pr-4">${weekTotal.toFixed(2)}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-2">
                                <Accordion type="multiple" className="w-full space-y-1">
                                    {days.map(({ dayName, total, orders }) => (
                                        <AccordionItem value={`${monthYearKey}-${weekName}-${dayName}`} key={`${monthYearKey}-${weekName}-${dayName}`} className="border-b-0">
                                            <AccordionTrigger className="px-3 py-1 hover:no-underline text-sm bg-muted/50 rounded-t-md data-[state=open]:rounded-b-none">
                                                 <div className="flex justify-between w-full">
                                                    <span>{dayName}</span>
                                                    <span className="font-bold pr-4">${total.toFixed(2)}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-2 border border-t-0 rounded-b-md">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Hora</TableHead>
                                                            <TableHead>Orden</TableHead>
                                                            <TableHead className="text-right">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {orders.map(order => (
                                                            <TableRow key={order.id}>
                                                                <TableCell>{format(order.lastUpdated, 'p', { locale: es })}</TableCell>
                                                                <TableCell>{getOrderIdentifier(order)}</TableCell>
                                                                <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                   </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
           <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No hay datos históricos de ventas.</p>
            </CardContent>
           </Card>
        )}
      </div>
    </div>
  );
}
