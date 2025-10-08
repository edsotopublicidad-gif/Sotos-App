"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { UserRole, Order, OrderStatus, MenuItem } from '@/lib/types';
import { initialOrders as fallbackOrders, menuItems as defaultMenuItems } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { defaultPasswords } from '@/lib/data';
import { getYear, getMonth, parseISO, isDate } from 'date-fns';

interface NotificationContextType {
  playOrderNotification: () => void;
  playBroadcastNotification: () => void;
  playPaymentNotification: () => void;
  playLogoutNotification: () => void;
}
export const NotificationContext = createContext<NotificationContextType | null>(null);

interface AppContextType {
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

export const AppContext = createContext<AppContextType>({
  role: null,
  setRole: () => {},
  orders: [],
  archivedOrders: [],
  menuItems: [],
  addMenuItem: () => ({} as MenuItem),
  updateMenuItem: () => {},
  deleteMenuItem: () => {},
  moveMenuItem: () => {},
  toggleMenuItemAvailability: () => {},
  addOrder: () => {},
  updateOrder: () => {},
  cancelOrder: () => {},
  getWaiterOrders: () => [],
  getDeliveryOrders: () => [],
  archiveTodaysOrders: () => {},
  clearWaiterSoldOrders: () => {},
  clearDeliverySoldOrders: () => {},
  clearKitchenCompletedOrders: () => {},
  broadcastMessage: () => {},
  broadcastData: null,
  clearBroadcast: () => {},
  clearArchivedOrders: () => {},
  clearArchivedOrdersByMonth: () => {},
});

const mapOrderDates = (order: any): Order => ({
  ...order,
  timestamp: new Date(order.timestamp),
  lastUpdated: new Date(order.lastUpdated),
  ...(order.acceptedAt && { acceptedAt: new Date(order.acceptedAt) }),
  ...(order.deliveredAt && { deliveredAt: new Date(order.deliveredAt) }),
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { toast } = useToast();
  const [orderAudio, setOrderAudio] = useState<HTMLAudioElement | null>(null);
  const [broadcastAudio, setBroadcastAudio] = useState<HTMLAudioElement | null>(null);
  const [paymentAudio, setPaymentAudio] = useState<HTMLAudioElement | null>(null);
  const [logoutAudio, setLogoutAudio] = useState<HTMLAudioElement | null>(null);
  const [broadcastData, setBroadcastData] = useState<{ message: string; timestamp: number } | null>(null);

  useEffect(() => {
    setOrderAudio(new Audio('https://cdn.pixabay.com/download/audio/2025/09/11/audio_1e5c38cd49.mp3?filename=ding-ding-alert-403183.mp3'));
    setBroadcastAudio(new Audio('https://cdn.pixabay.com/download/audio/2022/10/28/audio_2434180442.mp3?filename=new-notification-020-352772.mp3'));
    setPaymentAudio(new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_28b4c1a788.mp3?filename=cashier-quotka-chingquot-sound-effect-129698.mp3'));
    setLogoutAudio(new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c35a64a665.mp3?filename=bubble-254773.mp3'));
  }, []);

  const playOrderNotification = useCallback(() => {
    orderAudio?.play().catch(error => console.log("Order audio playback failed:", error));
  }, [orderAudio]);
  
  const playBroadcastNotification = useCallback(() => {
    broadcastAudio?.play().catch(error => console.log("Broadcast audio playback failed:", error));
  }, [broadcastAudio]);

  const playPaymentNotification = useCallback(() => {
    paymentAudio?.play().catch(error => console.log("Payment audio playback failed:", error));
  }, [paymentAudio]);

  const playLogoutNotification = useCallback(() => {
    logoutAudio?.play().catch(error => console.log("Logout audio playback failed:", error));
  }, [logoutAudio]);

  // Initialize and load data from localStorage on initial mount
  useEffect(() => {
    try {
      // Initialize passwords if not already in localStorage
      const storedPasswords = localStorage.getItem('sotos_passwords');
      if (!storedPasswords) {
        localStorage.setItem('sotos_passwords', JSON.stringify(defaultPasswords));
      }

      const storedRole = sessionStorage.getItem('userRole') as UserRole;
      if (storedRole) {
        setRoleState(storedRole);
      }

      const storedMenuItems = localStorage.getItem('sotos_menu_items');
      let loadedMenuItems: MenuItem[];
      if (storedMenuItems) {
        // Ensure all items have an order property
        loadedMenuItems = JSON.parse(storedMenuItems).map((item: any, index: number) => ({
            ...item,
            order: item.order ?? index,
            isDisabled: item.isDisabled ?? false,
        }));
      } else {
        loadedMenuItems = defaultMenuItems.map((item, index) => ({ ...item, order: index, isDisabled: false }));
        localStorage.setItem('sotos_menu_items', JSON.stringify(loadedMenuItems));
      }
      setMenuItems(loadedMenuItems);

      const storedOrders = localStorage.getItem('sotos_orders');
      if (storedOrders) {
          setOrders(JSON.parse(storedOrders).map(mapOrderDates));
      } else {
          setOrders([]);
      }

      const storedArchivedOrders = localStorage.getItem('sotos_archived_orders');
      if (storedArchivedOrders) {
          setArchivedOrders(JSON.parse(storedArchivedOrders).map(mapOrderDates));
      } else {
          setArchivedOrders([]);
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setMenuItems(defaultMenuItems.map((item, index) => ({...item, order: index, isDisabled: false})));
      setOrders([]);
      setArchivedOrders([]);
    } finally {
      setIsDataLoaded(true);
    }
  }, []);


  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isDataLoaded) return;
    try {
      localStorage.setItem('sotos_orders', JSON.stringify(orders));
      localStorage.setItem('sotos_archived_orders', JSON.stringify(archivedOrders));
      localStorage.setItem('sotos_menu_items', JSON.stringify(menuItems));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [orders, archivedOrders, menuItems, isDataLoaded]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
       if (event.key === 'sotos_orders' && event.newValue) {
        const newOrders = JSON.parse(event.newValue);
        setOrders(newOrders.map(mapOrderDates));
      }
      if (event.key === 'sotos_archived_orders' && event.newValue) {
        const newArchivedOrders = JSON.parse(event.newValue);
        setArchivedOrders(newArchivedOrders.map(mapOrderDates));
      }
       if (event.key === 'sotos_menu_items' && event.newValue) {
        setMenuItems(JSON.parse(event.newValue));
      }
      if (event.key === 'sotos_broadcast_message' && event.newValue) {
        const newBroadcast = JSON.parse(event.newValue);
        // Using a functional update with a check to prevent loops
        setBroadcastData(prevData => {
            if (prevData?.timestamp !== newBroadcast.timestamp) {
                playBroadcastNotification();
                return newBroadcast;
            }
            return prevData;
        });
      }
      // Force logout if password changed
      if (event.key === 'sotos_password_change_event' && event.newValue) {
        const { changedRole } = JSON.parse(event.newValue);
        if (role === changedRole) {
          toast({
            title: "Contraseña Actualizada",
            description: "Tu contraseña ha sido cambiada por el Jefe. Por favor, inicia sesión de nuevo.",
            variant: "destructive"
          });
          setRole(null); // This triggers logout
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [role, playBroadcastNotification, toast]);
  
  const setRole = (newRole: UserRole | null) => {
    setRoleState(newRole);
    if (newRole) {
      sessionStorage.setItem('userRole', newRole);
    } else {
      sessionStorage.removeItem('userRole');
    }
  };

  const addMenuItem = (item: Omit<MenuItem, 'id' | 'order'>): MenuItem => {
    const maxOrder = menuItems.length > 0 ? Math.max(...menuItems.map(item => item.order)) : -1;
    const newItem: MenuItem = {
      ...item,
      id: item.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      order: maxOrder + 1,
      isDisabled: false,
    };
    setMenuItems(prev => [...prev, newItem]);
    toast({ title: 'Éxito', description: 'El producto ha sido añadido al menú.'});
    return newItem;
  };

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    toast({ title: 'Éxito', description: 'El producto ha sido actualizado.'});
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    toast({ title: 'Éxito', description: 'El producto ha sido eliminado del menú.'});
  };

  const moveMenuItem = (itemId: string, direction: 'up' | 'down') => {
    setMenuItems(prevItems => {
        const items = [...prevItems].sort((a, b) => a.order - b.order);
        const currentIndex = items.findIndex(item => item.id === itemId);

        if (currentIndex === -1) return prevItems;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= items.length) return prevItems;
        
        // Swap order properties
        const newItems = [...items];
        const currentItemOrder = newItems[currentIndex].order;
        newItems[currentIndex].order = newItems[targetIndex].order;
        newItems[targetIndex].order = currentItemOrder;

        return newItems;
    });
  };

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, isDisabled: !item.isDisabled } : item
      )
    );
  };
  
  const broadcastMessage = (message: string) => {
    const newBroadcast = { message, timestamp: Date.now() };
    localStorage.setItem('sotos_broadcast_message', JSON.stringify(newBroadcast));
    // Trigger local update for the broadcaster's tab
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'sotos_broadcast_message',
        newValue: JSON.stringify(newBroadcast),
      })
    );
  };

  const clearBroadcast = () => {
    setBroadcastData(null);
  }


  const addOrder = (orderData: Omit<Order, 'id' | 'timestamp' | 'lastUpdated'|'isPaid'>) => {
    const newOrder: Order = {
      ...orderData,
      id: (Math.random() * 1000000).toFixed(0),
      timestamp: new Date(),
      lastUpdated: new Date(),
      isPaid: orderData.status === 'pagada',
    };
    if (newOrder.isPaid) {
        newOrder.status = 'pendiente';
        playPaymentNotification();
    }

    setOrders(prevOrders => [...prevOrders, newOrder]);
    let orderIdentifier = '';
    switch (newOrder.type) {
      case 'mesa':
        orderIdentifier = `para la mesa ${newOrder.table}`;
        break;
      case 'delivery':
        orderIdentifier = 'para delivery';
        break;
      case 'pickup':
        orderIdentifier = `de ${newOrder.customerName}`;
        break;
    }

    if (role !== 'mesero' && role !== 'delivery') {
        toast({ title: 'Nuevo Pedido', description: `Ha entrado un nuevo pedido ${orderIdentifier}` });
        playOrderNotification();
    }
  };

  const updateOrder = (orderId: string, updates: Partial<Omit<Order, 'id'>>) => {
    let originalOrder: Order | undefined;
    setOrders(prevOrders => {
      originalOrder = prevOrders.find(order => order.id === orderId);
      if (!originalOrder) return prevOrders;

      const updatedOrder = { ...originalOrder, ...updates, lastUpdated: new Date() };
      
      const wasPaidInThisUpdate = !originalOrder.isPaid && updates.isPaid;
      if(wasPaidInThisUpdate) {
        playPaymentNotification();
      }
      
      if (updates.isPaid && updatedOrder.status === 'entregada') {
        updatedOrder.status = 'pagada';
      }

      if (updates.status === 'entregada' && updatedOrder.isPaid) {
        updatedOrder.status = 'pagada';
      }
      
      if (updates.status === 'pagada') {
         updatedOrder.isPaid = true;
         if (originalOrder.status === 'entregada' || originalOrder.status === 'lista_para_entrega' || originalOrder.status === 'en_camino') {
            updatedOrder.status = 'pagada';
         } else {
            updatedOrder.status = originalOrder.status; 
         }
      }

      return prevOrders.map(order =>
        order.id === orderId
          ? updatedOrder
          : order
      )
    });

    if (originalOrder && updates.status && originalOrder.status !== updates.status) {
      const newStatus = updates.status as OrderStatus;
      let orderIdentifier = '';
       switch (originalOrder.type) {
        case 'mesa':
          orderIdentifier = `Mesa #${originalOrder.table}`;
          break;
        case 'delivery':
          orderIdentifier = `Pedido a Domicilio`;
          break;
        case 'pickup':
          orderIdentifier = `Pedido de ${originalOrder.customerName}`;
          break;
      }
      
      const meseroRoles: UserRole[] = ['mesero', 'jefe'];
      const deliveryRoles: UserRole[] = ['delivery', 'jefe'];

      if (newStatus === 'lista_para_entrega' && meseroRoles.includes(role!)) {
        if ((originalOrder.type === 'mesa' || originalOrder.type === 'pickup') && (originalOrder.waiterId === 'mesero1' || role === 'jefe')) {
          toast({ title: 'Orden Lista', description: `El pedido de ${orderIdentifier} está listo para ser entregado.` });
          playOrderNotification();
        }
      }
      
      if (newStatus === 'lista_para_entrega' && originalOrder.type === 'delivery' && deliveryRoles.includes(role!)) {
        toast({ title: 'Pedido Listo para Delivery', description: `El pedido a domicilio está listo para ser recogido.` });
        playOrderNotification();
      }
    }
  };
  
  const cancelOrder = (orderId: string) => {
    updateOrder(orderId, { status: 'cancelada' });
  };

  const getWaiterOrders = (waiterId: string) => {
    return orders.filter(order => order.waiterId === waiterId);
  };
  
  const getDeliveryOrders = (deliveryId: string) => {
    return orders.filter(order => order.waiterId === deliveryId);
  };

  const archiveTodaysOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const statusesToArchive: OrderStatus[] = ['pagada', 'cancelada'];
    
    const ordersToArchive = orders.filter(order => {
        const orderDate = new Date(order.lastUpdated);
        return statusesToArchive.includes(order.status) && orderDate >= today;
    });

    const remainingOrders = orders.filter(order => !ordersToArchive.some(archived => archived.id === order.id));

    setArchivedOrders(prevArchived => [...prevArchived, ...ordersToArchive]);
    setOrders(remainingOrders);
    
    toast({
      title: "Cierre del Día Realizado",
      description: `${ordersToArchive.length} órdenes han sido archivadas en el historial.`,
    });
  };

  const clearWaiterSoldOrders = (waiterId: string) => {
    setOrders(prevOrders =>
      prevOrders.filter(
        order => !(order.waiterId === waiterId && order.status === 'pagada')
      )
    );
    toast({
      title: "Servicio Finalizado",
      description: "Tus ventas del día han sido archivadas. ¡Listo para un nuevo día!",
    });
  };

  const clearDeliverySoldOrders = (deliveryId: string) => {
    setOrders(prevOrders =>
      prevOrders.filter(
        order => !(order.waiterId === deliveryId && order.status === 'pagada')
      )
    );
    toast({
      title: "Servicio Finalizado",
      description: "Tus entregas del día han sido archivadas. ¡Listo para un nuevo día!",
    });
  };
  
  const clearKitchenCompletedOrders = () => {
    const completedStatuses: OrderStatus[] = ['lista_para_entrega', 'en_camino', 'entregada', 'pagada'];
    setOrders(prevOrders => 
      prevOrders.filter(order => !completedStatuses.includes(order.status))
    );
    toast({
      title: "Servicio de Cocina Finalizado",
      description: "El historial de pedidos preparados ha sido limpiado.",
    });
  };

  const clearArchivedOrders = () => {
    setArchivedOrders([]);
    // localStorage.setItem('sotos_archived_orders', '[]');
    toast({
        title: "Historial de Ventas Eliminado",
        description: "Todos los registros de ventas archivadas han sido eliminados.",
    });
  };

  const clearArchivedOrdersByMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    
    setArchivedOrders(prevArchived => {
        const filtered = prevArchived.filter(order => {
            const orderDate = isDate(order.lastUpdated) ? order.lastUpdated : parseISO(order.lastUpdated as unknown as string);
            if (!isDate(orderDate)) return true; // keep if date is invalid
            return !(getYear(orderDate) === year && getMonth(orderDate) === month);
        });

        toast({
            title: 'Historial Mensual Eliminado',
            description: `Se han eliminado los registros de ventas para el mes seleccionado.`
        });
        
        return filtered;
    });
  };

  const contextValue = {
    role,
    setRole,
    orders,
    archivedOrders,
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    moveMenuItem,
    toggleMenuItemAvailability,
    addOrder,
    updateOrder,
    cancelOrder,
    getWaiterOrders,
    getDeliveryOrders,
    archiveTodaysOrders,
    clearWaiterSoldOrders,
    clearDeliverySoldOrders,
    clearKitchenCompletedOrders,
    broadcastMessage,
    broadcastData,
    clearBroadcast,
    clearArchivedOrders,
    clearArchivedOrdersByMonth,
  };

  const notificationContextValue = {
    playOrderNotification,
    playBroadcastNotification,
    playPaymentNotification,
    playLogoutNotification,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        {children}
      </NotificationContext.Provider>
    </AppContext.Provider>
  );
};
