"use client"

import { useState, useEffect, useContext } from 'react';
import type { Order, OrderStatus, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/components/app/AppContext';
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
import PaymentModal from '../mesero/PaymentModal';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, MessageSquareWarning } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface OrderCardProps {
  order: Order;
  onEdit?: (orderId: string) => void;
}

const statusConfig: Record<OrderStatus, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente: { text: 'En Espera', variant: 'secondary' },
  en_proceso: { text: 'En Proceso', variant: 'default' },
  lista_para_entrega: { text: 'Lista para Entrega', variant: 'default' },
  en_camino: { text: 'En Camino', variant: 'default' },
  entregada: { text: 'Entregada', variant: 'outline' },
  pagada: { text: 'Pagada', variant: 'outline' },
  cancelada: { text: 'Cancelada', variant: 'destructive' },
  archived: { text: 'Archivada', variant: 'outline'}
};

const formatElapsedTime = (startTime: Date): string => {
  const now = new Date();
  const diff = now.getTime() - startTime.getTime();
  if (diff < 0) return '0m 0s';
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

const toDate = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

export default function OrderCard({ order, onEdit }: OrderCardProps) {
  const { role, updateOrder, cancelOrder } = useContext(AppContext);
  const [elapsedTime, setElapsedTime] = useState('0m 0s');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let timerSourceDate: Date | undefined;
    const orderTimestamp = toDate(order.timestamp);
    const orderLastUpdated = toDate(order.lastUpdated);

    if (role === 'mesero' || role === 'delivery' || role === 'jefe') {
        if (order.status === 'lista_para_entrega') {
            timerSourceDate = orderLastUpdated; 
        } else {
            timerSourceDate = orderTimestamp;
        }
    } else if (role === 'cocina') {
        if (['pendiente', 'en_proceso'].includes(order.status)) {
            timerSourceDate = orderTimestamp;
        }
    }


    if (!timerSourceDate || (order.status === 'lista_para_entrega' && role === 'cocina') || ['entregada', 'pagada', 'cancelada', 'archived'].includes(order.status)) {
        setElapsedTime('');
        return;
    }
    
    const interval = setInterval(() => {
        if(timerSourceDate) {
            setElapsedTime(formatElapsedTime(timerSourceDate));
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [order.status, order.timestamp, order.lastUpdated, role]);
  
  const handleStatusUpdate = (newStatus: OrderStatus) => {
    const updates: Partial<Order> = { status: newStatus };
    if (newStatus === 'en_proceso') {
      updates.acceptedAt = Timestamp.now();
    }
    if (newStatus === 'entregada') {
      updates.deliveredAt = Timestamp.now();
    }
    updateOrder(order.id, updates);
  };
  
  const handleCancelOrder = () => {
    cancelOrder(order.id);
  }

  const handlePaymentConfirm = (paymentMethod: PaymentMethod, reference?: string) => {
    updateOrder(order.id, {
      isPaid: true,
      paymentMethod,
      paymentReference: reference,
    });
    toast({ title: 'Éxito', description: `Orden pagada correctamente.` });
    setIsPaymentModalOpen(false);
  }

  const renderMeseroActions = () => {
    const actions = [];
    const isActiveOrder = ['pendiente', 'en_proceso', 'lista_para_entrega'].includes(order.status);

    if (order.status === 'lista_para_entrega' && (order.type === 'mesa' || order.type === 'pickup')) {
      actions.push(<Button key="entregado" size="sm" onClick={() => handleStatusUpdate('entregada')}>Entregado</Button>);
    }

    if (isActiveOrder && onEdit) {
      actions.push(
          <Button key="editar" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => onEdit(order.id)}>Editar</Button>
      );
    }
    
    if (isActiveOrder) {
        actions.push(
             <AlertDialog key="cancelar-pendiente">
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">Cancelar</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se cancelará la orden permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cerrar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelOrder}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
        )
    }

    if (!order.isPaid && (order.status === 'entregada' || (isActiveOrder && order.type !== 'mesa'))) {
        actions.push(
         <Button 
            key="confirmar_pago" 
            size="sm" 
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
        >
            Confirmar Pago
        </Button>
        );
    }

    return actions;
  };

  const renderCocinaActions = () => {
    const actions = [];
    if (order.status === 'pendiente') {
      actions.push(<Button key="recibido" size="sm" onClick={() => handleStatusUpdate('en_proceso')} className="bg-yellow-500 hover:bg-yellow-600 text-black">Recibido</Button>);
    }
    if (order.status === 'en_proceso') {
      actions.push(<Button key="lista_para_entrega" size="sm" onClick={() => handleStatusUpdate('lista_para_entrega')}>Orden Lista</Button>);
    }
    return actions;
  };

  const renderDeliveryActions = () => {
    const actions = [];
    const isActiveOrder = ['pendiente', 'en_proceso', 'lista_para_entrega', 'en_camino'].includes(order.status);
    if (isActiveOrder && onEdit) {
      actions.push(
          <Button key="editar_delivery" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => onEdit(order.id)}>Editar</Button>
      );
    }
    if (order.status === 'lista_para_entrega' && order.type === 'delivery') {
      actions.push(<Button key="en_camino" size="sm" onClick={() => handleStatusUpdate('en_camino')}>Tomar Pedido</Button>);
    }
    if (order.status === 'lista_para_entrega' && order.type === 'pickup') {
      actions.push(<Button key="entregado_pickup_delivery" size="sm" onClick={() => handleStatusUpdate('entregada')}>Entregado</Button>);
    }
    if (order.status === 'en_camino') {
      actions.push(<Button key="entregada_delivery" size="sm" onClick={() => handleStatusUpdate('entregada')}>Marcar Entregada</Button>);
    }
    if (!order.isPaid && order.status === 'entregada') {
        actions.push(
         <Button 
            key="confirmar_pago_delivery" 
            size="sm" 
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
        >
            Confirmar Pago
        </Button>
        );
    }
    return actions;
  };

  const renderActions = () => {
    switch (role) {
      case 'mesero':
        return <div className="flex flex-wrap gap-2 justify-end">{renderMeseroActions()}</div>;
      case 'cocina':
        return <div className="flex gap-2">{renderCocinaActions()}</div>;
      case 'delivery':
        return <div className="flex flex-wrap gap-2 justify-end">{renderDeliveryActions()}</div>;
      case 'jefe':
        return (
          <div className="flex flex-wrap gap-2 justify-end">
            {renderMeseroActions()}
            {renderCocinaActions()}
            {renderDeliveryActions()}
          </div>
        );
      default:
        return null;
    }
  };

  let statusInfo = statusConfig[order.status];
  const completedKitchenStatuses: OrderStatus[] = ['lista_para_entrega', 'en_camino', 'entregada', 'pagada'];
  if (role === 'cocina' && completedKitchenStatuses.includes(order.status)) {
    // Custom status for completed kitchen orders
    statusInfo = { text: 'Finalizado', variant: 'default' };
  }
  
  const showTimer = !!elapsedTime;

  const getOrderTitle = () => {
    switch (order.type) {
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

  const orderTimestamp = toDate(order.timestamp);

  return (
    <>
    <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        total={order.total}
        onConfirm={handlePaymentConfirm}
      />
    <Card className={'relative'}>
      {(role !== 'cocina' || role === 'jefe') && order.isPaid && order.status !== 'pagada' && (
        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full" title="Esta orden ya fue pagada">
          <DollarSign className="h-4 w-4" />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {getOrderTitle()}
          </CardTitle>
          {showTimer && <div className="text-sm font-semibold text-muted-foreground">{elapsedTime}</div>}
        </div>
        <div className="text-xs text-muted-foreground">
          {orderTimestamp.toLocaleDateString('es-VE')} {orderTimestamp.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })} - {order.waiterName}
        </div>
      </CardHeader>
      <CardContent>
        {order.notes && (
          <div className="mb-4 p-3 rounded-md bg-accent/20 border border-accent/50">
            <h4 className="flex items-center text-sm font-semibold mb-1 text-accent-foreground/90">
              <MessageSquareWarning className="h-4 w-4 mr-2" />
              Notas de la Orden
            </h4>
            <p className="text-sm text-accent-foreground/80">{order.notes}</p>
          </div>
        )}
        <ul className="space-y-1 text-sm list-disc list-inside">
          {order.items.map(item => (
            <li key={item.id}>{item.name} x{item.quantity}</li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between items-center">
           <Badge variant={statusInfo.variant} className={statusInfo.text === 'Finalizado' ? 'bg-green-600 text-white' : ''}>
              {statusInfo.text}
              {(role === 'mesero' || role === 'jefe' || role === 'delivery') && order.status === 'lista_para_entrega' && ` (hace ${elapsedTime})`}
          </Badge>
          {role !== 'cocina' && <div className="font-bold text-lg">${order.total.toFixed(2)}</div>}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {renderActions()}
      </CardFooter>
    </Card>
    </>
  );
}
