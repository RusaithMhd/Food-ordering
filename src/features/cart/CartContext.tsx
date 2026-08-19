'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem } from '@/types/menu'; // We will define this

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addItem: (menuItem: MenuItem, quantity?: number, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from local storage', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = (menuItem: MenuItem, quantity = 1, notes = '') => {
    setItems((currentItems) => {
      // Check if exact same item with same notes exists
      const existingItemIndex = currentItems.findIndex(
        (item) => item.menuItem.id === menuItem.id && 
                  item.menuItem.base_price === menuItem.base_price && 
                  item.notes === notes
      );

      if (existingItemIndex >= 0) {
        const newItems = [...currentItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      return [
        ...currentItems,
        {
          id: Math.random().toString(36).substring(7), // Generate simple unique ID for cart row
          menuItem,
          quantity,
          notes,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce(
    (total, item) => total + item.menuItem.base_price * item.quantity,
    0
  );

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
