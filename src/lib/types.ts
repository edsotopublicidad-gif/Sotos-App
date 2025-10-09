import { Timestamp } from 'firebase/firestore';

export type UserRole = 'mesero' | 'cocina' | 'delivery' | 'jefe';

export type PaymentMethod = 'pago_movil' | 'transferencia' | 'efectivo' | 'divisas' | 'nfc';

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  order: number;
  isDisabled?: boolean;
};

export type OrderItem = MenuItem & {
  quantity: number;
};

export type OrderStatus =
  | 'pendiente' // En espera de que cocina acepte
  | 'en_proceso'
  | 'lista_para_entrega'
  | 'en_camino'
  | 'entregada'
  | 'pagada' // This status now represents a fully completed (delivered and paid) order
  | 'cancelada'
  | 'archived';

export type Order = {
  id: string;
  type: 'mesa' | 'delivery' | 'pickup';
  table?: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  isPaid: boolean; // New field to track payment status independently
  notes?: string;
  timestamp: Timestamp; // Creacion del pedido
  acceptedAt?: Timestamp; // Cuando cocina acepta
  lastUpdated: Timestamp;
  waiterId: string;
  waiterName: string;
  deliveredAt?: Timestamp;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
};

export type Passwords = {
  [key in UserRole]: string;
};

export type BroadcastMessage = {
  message: string;
  timestamp: Timestamp;
}
