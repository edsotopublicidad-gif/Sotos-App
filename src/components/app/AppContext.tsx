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
  clearWaiterCancelledOrders: (waiterId: string) => void;
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
  clearWaiterCancelledOrders: () => {},
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

const triggerStorageEvent = (key: string, value: any) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(
            new StorageEvent('storage', {
                key: key,
                newValue: JSON.stringify(value),
                storageArea: localStorage
            })
        );
    }
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { toast } = useToast();
  const [orderAudio, setOrderAudio] = useState<HTMLAudioElement | null>(null);
  const [broadcastAudio, setBroadcastAudio] = useState<HTMLAudioElement | null>(null);
  const [paymentAudio, setPaymentAudio] = useState<HTMLAudioElement | null>(null);
  const [logoutAudio, setLogoutAudio] = useState<HTMLAudioElement | null>(null);
  const [broadcastData, setBroadcastData] = useState<{ message: string; timestamp: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setOrderAudio(new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c31f0c2940.mp3?filename=bell-notification-83342.mp3'));
        setBroadcastAudio(new Audio('https://cdn.pixabay.com/download/audio/2022/10/28/audio_2434180442.mp3?filename=new-notification-020-352772.mp3'));
        setPaymentAudio(new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_28b4c1a788.mp3?filename=cashier-quotka-chingquot-sound-effect-129698.mp3'));
        setLogoutAudio(new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c35a64a665.mp3?filename=bubble-254773.mp3'));
    }
  }, []);

  const playAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => console.log("Audio playback failed:", error));
    }
  }, []);

  const playOrderNotification = useCallback(() => playAudio(orderAudio), [playAudio, orderAudio]);
  const playBroadcastNotification = useCallback(() => playAudio(broadcastAudio), [playAudio, broadcastAudio]);
  const playPaymentNotification = useCallback(() => playAudio(paymentAudio), [playAudio, paymentAudio]);
  const playLogoutNotification = useCallback(() => playAudio(logoutAudio), [playAudio, logoutAudio]);

  const loadDataFromStorage = useCallback((event?: StorageEvent) => {
    try {
        const storedRole = sessionStorage.getItem('userRole') as UserRole;
        if (storedRole) setRoleState(storedRole);

        const storedMenuItems = localStorage.getItem('sotos_menu_items');
        const loadedMenuItems: MenuItem[] = storedMenuItems 
            ? JSON.parse(storedMenuItems).map((item: any, index: number) => ({ ...item, order: item.order ?? index, isDisabled: item.isDisabled ?? false }))
            : defaultMenuItems.map((item, index) => ({ ...item, order: index, isDisabled: false }));
        setMenuItems(current => JSON.stringify(current) !== JSON.stringify(loadedMenuItems) ? loadedMenuItems : current);

        const storedOrders = localStorage.getItem('sotos_orders');
        const loadedOrders = storedOrders ? JSON.parse(storedOrders).map(mapOrderDates) : [];
        setOrders(current => {
            if (JSON.stringify(current) !== JSON.stringify(loadedOrders)) {
                if (event && event.key === 'sotos_orders' && role === 'cocina' && loadedOrders.length > current.length) {
                    playOrderNotification();
                }
                return loadedOrders;
            }
            return current;
        });

        const storedArchivedOrders = localStorage.getItem('sotos_archived_orders');
        const loadedArchivedOrders = storedArchivedOrders ? JSON.parse(storedArchivedOrders).map(mapOrderDates) : [];
        setArchivedOrders(current => JSON.stringify(current) !== JSON.stringify(loadedArchivedOrders) ? loadedArchivedOrders : current);
        
        const storedBroadcast = localStorage.getItem('sotos_broadcast_message');
        const loadedBroadcast = storedBroadcast ? JSON.parse(storedBroadcast) : null;
        setBroadcastData(current => {
             if (JSON.stringify(current) !== JSON.stringify(loadedBroadcast)) {
                if (event && event.key === 'sotos_broadcast_message' && loadedBroadcast && current?.timestamp !== loadedBroadcast.timestamp && role !== 'jefe') {
                  playBroadcastNotification();
                }
                return loadedBroadcast;
            }
            return current;
        });

    } catch (error) {
        console.error("Failed to load data from localStorage", error);
    }
  }, [role, playOrderNotification, playBroadcastNotification]);

  useEffect(() => {
    const storedPasswords = localStorage.getItem('sotos_passwords');
    if (!storedPasswords) {
      localStorage.setItem('sotos_passwords', JSON.stringify(defaultPasswords));
    }
    loadDataFromStorage();
  }, [loadDataFromStorage]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        loadDataFromStorage(event);
    };
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(() => {
        loadDataFromStorage();
    }, 5000); 

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
    };
  }, [loadDataFromStorage]);
  
  const setRole = (newRole: UserRole | null) => {
    setRoleState(newRole);
    if (newRole) {
      sessionStorage.setItem('userRole', newRole);
    } else {
      sessionStorage.removeItem('userRole');
      playLogoutNotification();
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
    setMenuItems(prev => {
        const newItems = [...prev, newItem];
        triggerStorageEvent('sotos_menu_items', newItems);
        return newItems;
    });
    toast({ title: 'Éxito', description: 'El producto ha sido añadido al menú.'});
    return newItem;
  };

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => {
        const newItems = prev.map(item => item.id === itemId ? { ...item, ...updates } : item);
        triggerStorageEvent('sotos_menu_items', newItems);
        return newItems;
    });
    toast({ title: 'Éxito', description: 'El producto ha sido actualizado.'});
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems(prev => {
        const newItems = prev.filter(item => item.id !== itemId);
        triggerStorageEvent('sotos_menu_items', newItems);
        return newItems;
    });
    toast({ title: 'Éxito', description: 'El producto ha sido eliminado del menú.'});
  };

  const moveMenuItem = (itemId: string, direction: 'up' | 'down') => {
    setMenuItems(prevItems => {
        const items = [...prevItems].sort((a, b) => a.order - b.order);
        const currentIndex = items.findIndex(item => item.id === itemId);

        if (currentIndex === -1) return prevItems;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= items.length) return prevItems;
        
        const newItems = [...items];
        const currentItemOrder = newItems[currentIndex].order;
        newItems[currentIndex].order = newItems[targetIndex].order;
        newItems[targetIndex].order = currentItemOrder;

        triggerStorageEvent('sotos_menu_items', newItems);
        return newItems;
    });
  };

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems(prev => {
        const newItems = prev.map(item => 
            item.id === itemId ? { ...item, isDisabled: !item.isDisabled } : item
        );
        triggerStorageEvent('sotos_menu_items', newItems);
        return newItems;
    });
  };
  
  const broadcastMessage = (message: string) => {
    const newBroadcast = { message, timestamp: Date.now() };
    triggerStorageEvent('sotos_broadcast_message', newBroadcast);
    playBroadcastNotification();
  };

  const clearBroadcast = () => {
    setBroadcastData(null);
    localStorage.removeItem('sotos_broadcast_message');
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
        if(role !== 'jefe') playPaymentNotification();
    }

    setOrders(prevOrders => {
        const newOrders = [...prevOrders, newOrder];
        triggerStorageEvent('sotos_orders', newOrders);
        return newOrders;
    });

    if (role !== 'cocina') {
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
        if(role !== 'jefe') playPaymentNotification();
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

      const newOrders = prevOrders.map(order =>
        order.id === orderId
          ? updatedOrder
          : order
      );

      triggerStorageEvent('sotos_orders', newOrders);
      return newOrders;
    });

    if (originalOrder && updates.status && originalOrder.status !== updates.status) {
      const newStatus = updates.status as OrderStatus;
      
      const meseroRoles: UserRole[] = ['mesero', 'jefe'];
      const deliveryRoles: UserRole[] = ['delivery', 'jefe'];

      if (newStatus === 'lista_para_entrega') {
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

    setArchivedOrders(prevArchived => {
        const newArchived = [...prevArchived, ...ordersToArchive];
        triggerStorageEvent('sotos_archived_orders', newArchived);
        return newArchived;
    });
    setOrders(remainingOrders);
    triggerStorageEvent('sotos_orders', remainingOrders);
    
    toast({
      title: "Cierre del Día Realizado",
      description: `${ordersToArchive.length} órdenes han sido archivadas en el historial.`,
    });
  };

  const clearWaiterSoldOrders = (waiterId: string) => {
    setOrders(prevOrders => {
      const newOrders = prevOrders.filter(
        order => !(order.waiterId === waiterId && order.status === 'pagada')
      );
      triggerStorageEvent('sotos_orders', newOrders);
      return newOrders;
    });
    toast({
      title: "Servicio Finalizado",
      description: "Tus ventas del día han sido archivadas. ¡Listo para un nuevo día!",
    });
  };
  
  const clearWaiterCancelledOrders = (waiterId: string) => {
    setOrders(prevOrders => {
      const newOrders = prevOrders.filter(
        order => !(order.waiterId === waiterId && order.status === 'cancelada')
      );
      triggerStorageEvent('sotos_orders', newOrders);
      return newOrders;
    });
    toast({
      title: "Historial Limpio",
      description: "Tus órdenes canceladas han sido eliminadas del historial.",
    });
  };

  const clearDeliverySoldOrders = (deliveryId: string) => {
    setOrders(prevOrders => {
      const newOrders = prevOrders.filter(
        order => !(order.waiterId === deliveryId && order.status === 'pagada')
      );
      triggerStorageEvent('sotos_orders', newOrders);
      return newOrders;
    });
    toast({
      title: "Servicio Finalizado",
      description: "Tus entregas del día han sido archivadas. ¡Listo para un nuevo día!",
    });
  };
  
  const clearKitchenCompletedOrders = () => {
    const completedStatuses: OrderStatus[] = ['lista_para_entrega', 'en_camino', 'entregada', 'pagada'];
    setOrders(prevOrders => {
        const newOrders = prevOrders.filter(order => !completedStatuses.includes(order.status));
        triggerStorageEvent('sotos_orders', newOrders);
        return newOrders;
    });
    toast({
      title: "Servicio de Cocina Finalizado",
      description: "El historial de pedidos preparados ha sido limpiado.",
    });
  };

  const clearArchivedOrders = () => {
    setArchivedOrders([]);
    triggerStorageEvent('sotos_archived_orders', []);
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
        
        triggerStorageEvent('sotos_archived_orders', filtered);
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
    clearWaiterCancelledOrders,
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
