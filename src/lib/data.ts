import type { MenuItem, Order, Passwords } from './types';

export const menuItems: MenuItem[] = [
  { id: 'cono_pizza', name: 'Cono Pizza', price: 5.00 },
  { id: 'cono_pizza_xxl', name: 'Cono Pizza XXL', price: 8.00 },
  { id: 'rac_papas_fritas', name: 'Rac. Papas Fritas', price: 4.00 },
  { id: 'banderilla', name: 'Banderilla', price: 4.00 },
  { id: 'refresco_peq', name: 'Refresco Peq.', price: 2.50 },
  { id: 'refresco_grande', name: 'Refresco Grande', price: 4.00 },
];

export const initialOrders: Order[] = [];

export const defaultPasswords: Passwords = {
  mesero: 'Sotos_Mesas',
  cocina: 'Cocina_X',
  delivery: 'Entrega_S',
  jefe: 'Soto_Admin'
};
