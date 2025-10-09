"use client";

import { createContext, useState, useEffect, ReactNode, useCallback, useContext, useRef } from 'react';
import type { UserRole, Order, MenuItem, BroadcastMessage as BroadcastMessageType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, Timestamp, query, where, orderBy, deleteDoc, setDoc, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface AppContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  orders: Order[] | null;
  archivedOrders: Order[] | null;
  menuItems: MenuItem[] | null;
  isLoadingOrders: boolean;
  isLoadingMenuItems: boolean;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'order'>) => Promise<MenuItem | undefined>;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (itemId: string) => void;
  moveMenuItem: (itemId: string, direction: 'up' | 'down') => void;
  toggleMenuItemAvailability: (itemId: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'timestamp' | 'lastUpdated'>) => void;
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
  broadcastData: BroadcastMessageType | null;
  clearBroadcast: () => void;
  clearArchivedOrders: () => void;
  clearArchivedOrdersByMonth: (monthKey: string) => void;
  playPaymentNotification: () => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

const toDate = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

  // Sounds
  const [orderAudio, setOrderAudio] = useState<HTMLAudioElement | null>(null);
  const [broadcastAudio, setBroadcastAudio] = useState<HTMLAudioElement | null>(null);
  const [paymentAudio, setPaymentAudio] = useState<HTMLAudioElement | null>(null);
  const [logoutAudio, setLogoutAudio] = useState<HTMLAudioElement | null>(null);

  const prevOrdersRef = useRef<Order[] | null>(null);
  const isInitialLoadRef = useRef(true);

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

  // --- Firestore Data Hooks ---
  const ordersQuery = useMemoFirebase(() => role ? query(collection(firestore, 'orders'), where('status', '!=', 'archived')) : null, [firestore, role]);
  const { data: ordersData, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

  const archivedOrdersQuery = useMemoFirebase(() => role ? query(collection(firestore, 'orders'), where('status', '==', 'archived')) : null, [firestore, role]);
  const { data: archivedOrdersData } = useCollection<Order>(archivedOrdersQuery);
  
  const menuItemsQuery = useMemoFirebase(() => query(collection(firestore, 'menu_items'), orderBy('order')), [firestore]);
  const { data: menuItems, isLoading: isLoadingMenuItems } = useCollection<MenuItem>(menuItemsQuery);

  const broadcastDocRef = useMemoFirebase(() => doc(firestore, 'broadcast', 'message'), [firestore]);
  const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastMessageType>(broadcastDocRef);
  const prevBroadcastTimestamp = useRef<number | null>(null);

  useEffect(() => {
    if (isInitialLoadRef.current) {
        return;
    }

    if (ordersData && prevOrdersRef.current) {
        if (ordersData.length > prevOrdersRef.current.length && role === 'cocina') {
            playOrderNotification();
        }
    }
  }, [ordersData, role, playOrderNotification]);

  useEffect(() => {
    if (broadcastData?.timestamp && !isBroadcastLoading) {
      const newTimestamp = toDate(broadcastData.timestamp).getTime();
      if (prevBroadcastTimestamp.current !== null && newTimestamp > prevBroadcastTimestamp.current && role !== 'jefe') {
        playBroadcastNotification();
      }
      prevBroadcastTimestamp.current = newTimestamp;
    }
  }, [broadcastData, isBroadcastLoading, role, playBroadcastNotification]);
  
  useEffect(() => {
    prevOrdersRef.current = ordersData;
  }, [ordersData]);

  useEffect(() => {
    const timer = setTimeout(() => {
        isInitialLoadRef.current = false;
    }, 2000);
    return () => clearTimeout(timer);
  },[]);


  const setRole = (newRole: UserRole | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('userRole', newRole);
    } else {
      localStorage.removeItem('userRole');
      playLogoutNotification();
      signOut(auth);
    }
  };

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole;
    if (storedRole) {
      setRoleState(storedRole);
    }
  }, []);


  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'order'>): Promise<MenuItem | undefined> => {
    if(!menuItems || !firestore) return;
    const maxOrder = menuItems.length > 0 ? Math.max(...menuItems.map(item => item.order)) : -1;
    const newItem: Omit<MenuItem, 'id'> = {
      ...item,
      order: maxOrder + 1,
      isDisabled: false,
    };
    try {
        const docRef = await addDoc(collection(firestore, 'menu_items'), newItem);
        toast({ title: 'Éxito', description: 'El producto ha sido añadido al menú.'});
        return { ...newItem, id: docRef.id };
    } catch (error) {
        console.error("Error adding menu item: ", error);
        toast({ title: 'Error', description: 'No se pudo añadir el producto.', variant: 'destructive'});
    }
  };

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'menu_items', itemId);
    setDoc(docRef, updates, { merge: true }).then(() => {
        toast({ title: 'Éxito', description: 'El producto ha sido actualizado.'});
    }).catch(error => {
        console.error("Error updating menu item: ", error);
        toast({ title: 'Error', description: 'No se pudo actualizar el producto.', variant: 'destructive'});
    });
  };

  const deleteMenuItem = (itemId: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'menu_items', itemId)).then(() => {
        toast({ title: 'Éxito', description: 'El producto ha sido eliminado del menú.'});
    }).catch(error => {
        console.error("Error deleting menu item: ", error);
        toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive'});
    });
  };

  const moveMenuItem = async (itemId: string, direction: 'up' | 'down') => {
    if (!menuItems || !firestore) return;
    const sortedItems = [...menuItems].sort((a,b) => a.order - b.order);
    const currentIndex = sortedItems.findIndex(item => item.id === itemId);

    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedItems.length) return;

    const batch = writeBatch(firestore);
    const currentItemRef = doc(firestore, 'menu_items', sortedItems[currentIndex].id);
    const targetItemRef = doc(firestore, 'menu_items', sortedItems[targetIndex].id);

    batch.update(currentItemRef, { order: sortedItems[targetIndex].order });
    batch.update(targetItemRef, { order: sortedItems[currentIndex].order });

    await batch.commit();
  };

  const toggleMenuItemAvailability = (itemId: string) => {
    if (!menuItems) return;
    const item = menuItems.find(i => i.id === itemId);
    if(item) {
        updateMenuItem(itemId, { isDisabled: !item.isDisabled });
    }
  };
  
  const broadcastMessage = (message: string) => {
    if (!firestore || !broadcastDocRef) return;
    setDoc(broadcastDocRef, { message, timestamp: serverTimestamp() });
  };

  const clearBroadcast = () => {
    if (!firestore || !broadcastDocRef) return;
    setDoc(broadcastDocRef, { message: '', timestamp: serverTimestamp() });
  }

  const addOrder = (orderData: Omit<Order, 'id' | 'timestamp' | 'lastUpdated'>) => {
    if (!firestore) return;
    const newOrder = {
        ...orderData,
        timestamp: serverTimestamp(),
        lastUpdated: serverTimestamp(),
    };
    addDoc(collection(firestore, 'orders'), newOrder).then(() => {
        if(role !== 'jefe' && newOrder.isPaid) playPaymentNotification();
    }).catch(error => {
        console.error("Error adding order: ", error);
        toast({ title: 'Error', description: 'No se pudo crear la orden.', variant: 'destructive'});
    });
  };

  const updateOrder = (orderId: string, updates: Partial<Omit<Order, 'id'>>) => {
    if (!firestore || !ordersData) return;
    const orderDoc = doc(firestore, 'orders', orderId);
    let finalUpdates: Partial<Omit<Order, 'id' | 'timestamp' | 'lastUpdated'>> & { lastUpdated: Timestamp} = { ...updates, lastUpdated: serverTimestamp() as Timestamp};
    
    const originalOrder = ordersData?.find(o => o.id === orderId);

    if (originalOrder) {
        const wasPaidInThisUpdate = !originalOrder.isPaid && updates.isPaid;
        if(wasPaidInThisUpdate && role !== 'jefe') {
            playPaymentNotification();
        }
        if (updates.isPaid && finalUpdates.status === 'entregada') {
            finalUpdates.status = 'pagada';
        }
        if (updates.status === 'pagada') {
            finalUpdates.isPaid = true;
        }
    }

    setDoc(orderDoc, finalUpdates, { merge: true }).catch(error => {
        console.error("Error updating order: ", error);
        toast({ title: 'Error', description: 'No se pudo actualizar la orden.', variant: 'destructive'});
    });
  };
  
  const cancelOrder = (orderId: string) => {
    updateOrder(orderId, { status: 'cancelada' });
  };

  const getWaiterOrders = (waiterId: string) => {
    return (ordersData || []).filter(order => order.waiterId === waiterId);
  };
  
  const getDeliveryOrders = (deliveryId: string) => {
    return (ordersData || []).filter(order => order.waiterId === deliveryId);
  };

  const archiveTodaysOrders = async () => {
    if (!ordersData || !firestore) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const statusesToArchive = ['pagada', 'cancelada'];
    
    const ordersToArchive = ordersData.filter(order => {
        if(!order.lastUpdated) return false;
        const orderDate = toDate(order.lastUpdated);
        return statusesToArchive.includes(order.status) && orderDate >= today;
    });
    
    if (ordersToArchive.length === 0) {
        toast({ title: "Nada que archivar", description: "No hay órdenes completadas o canceladas hoy." });
        return;
    }

    const batch = writeBatch(firestore);
    ordersToArchive.forEach(order => {
        const docRef = doc(firestore, 'orders', order.id);
        batch.update(docRef, { status: 'archived' });
    });

    await batch.commit();
    toast({
      title: "Cierre del Día Realizado",
      description: `${ordersToArchive.length} órdenes han sido archivadas en el historial.`,
    });
  };

  const clearOrdersByIdAndStatus = async (ownerId: string, statuses: string[], idField: 'waiterId') => {
      if(!ordersData || !firestore) return;

      const ordersToClear = (ordersData || []).filter(order => order[idField] === ownerId && statuses.includes(order.status));

      if(ordersToClear.length > 0) {
        const batch = writeBatch(firestore);
        ordersToClear.forEach(order => {
            const docRef = doc(firestore, 'orders', order.id);
            batch.delete(docRef);
        });
        await batch.commit();
      }
  }


  const clearWaiterSoldOrders = (waiterId: string) => {
    clearOrdersByIdAndStatus(waiterId, ['pagada'], 'waiterId');
    toast({
      title: "Servicio Finalizado",
      description: "Tus ventas del día han sido archivadas. ¡Listo para un nuevo día!",
    });
  };
  
  const clearWaiterCancelledOrders = (waiterId: string) => {
    clearOrdersByIdAndStatus(waiterId, ['cancelada'], 'waiterId');
    toast({
      title: "Historial Limpio",
      description: "Tus órdenes canceladas han sido eliminadas del historial.",
    });
  };

  const clearDeliverySoldOrders = (deliveryId: string) => {
    clearOrdersByIdAndStatus(deliveryId, ['pagada'], 'waiterId');
    toast({
      title: "Servicio Finalizado",
      description: "Tus entregas del día han sido archivadas. ¡Listo para un nuevo día!",
    });
  };
  
  const clearKitchenCompletedOrders = async () => {
    if(!ordersData || !firestore) return;
    const completedStatuses = ['lista_para_entrega', 'en_camino', 'entregada', 'pagada'];
    const ordersToClear = (ordersData || []).filter(order => completedStatuses.includes(order.status));
    
    if(ordersToClear.length > 0) {
        const batch = writeBatch(firestore);
        ordersToClear.forEach(order => {
            const docRef = doc(firestore, 'orders', order.id);
            batch.delete(docRef);
        });
        await batch.commit();
    }
    toast({
      title: "Servicio de Cocina Finalizado",
      description: "El historial de pedidos preparados ha sido limpiado.",
    });
  };

  const clearArchivedOrders = async () => {
    if (!archivedOrdersData || !firestore) return;
    const batch = writeBatch(firestore);
    archivedOrdersData.forEach(order => {
        batch.delete(doc(firestore, 'orders', order.id));
    });
    await batch.commit();
    toast({
        title: "Historial de Ventas Eliminado",
        description: "Todos los registros de ventas archivadas han sido eliminados.",
    });
  };

  const clearArchivedOrdersByMonth = async (monthKey: string) => {
    if (!archivedOrdersData || !firestore) return;
    const [year, month] = monthKey.split('-').map(Number);
    
    const ordersToDelete = (archivedOrdersData || []).filter(order => {
        if(!order.lastUpdated) return false;
        const orderDate = toDate(order.lastUpdated);
        return orderDate.getFullYear() === year && orderDate.getMonth() === month;
    });

    if(ordersToDelete.length > 0) {
        const batch = writeBatch(firestore);
        ordersToDelete.forEach(order => {
            batch.delete(doc(firestore, 'orders', order.id));
        });
        await batch.commit();
    }
    toast({
        title: 'Historial Mensual Eliminado',
        description: `Se han eliminado los registros de ventas para el mes seleccionado.`
    });
  };

  const contextValue: AppContextType = {
    role,
    setRole,
    orders: ordersData,
    archivedOrders: archivedOrdersData,
    menuItems,
    isLoadingOrders,
    isLoadingMenuItems,

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
    playPaymentNotification,
  };

  return (
    <AppContext.Provider value={contextValue}>
        {children}
    </AppContext.Provider>
  );
};
