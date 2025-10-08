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
  | 'cancelada';

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
  timestamp: Date; // Creacion del pedido
  acceptedAt?: Date; // Cuando cocina acepta
  lastUpdated: Date;
  waiterId: string;
  waiterName: string;
  deliveredAt?: Date;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
};

export type Passwords = {
  [key in UserRole]: string;
};

export interface AppContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  orders: Order[];
  archivedOrders: Order[];
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id' | 'order'>) => MenuItem;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (itemId: string) => void;
  moveMenuItem: (itemId: string, direction: 'up' | 'down') => void;
  toggleMenuItemAvailability: (itemId: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'timestamp' | 'lastUpdated' | 'isPaid'>) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  cancelOrder: (orderId: string) => void;
  getWaiterOrders: (waiterId: string) => Order[];
  getDeliveryOrders: (deliveryId: string) => Order[];
  archiveTodaysOrders: () => void;
  clearWaiterSoldOrders: (waiterId: string) => void;
  clearDeliverySoldOrders: (deliveryId: string) => void;
  clearKitchenCompletedOrders: () => void;
  broadcastMessage: (message: string) => void;
  broadcastData: { message: string; timestamp: number } | null;
  clearBroadcast: () => void;
  clearArchivedOrders: () => void;
  clearArchivedOrdersByMonth: (monthKey: string) => void;
}
