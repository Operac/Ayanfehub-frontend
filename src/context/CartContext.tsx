import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  market_id: string;
  price: number;
  unit?: string;
  quantity: number;
  addedAt: string; // ISO timestamp — used for staleness warnings
}

type AddToCartPayload = Omit<CartItem, 'quantity' | 'addedAt'>;

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: AddToCartPayload) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  loading: boolean;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem('ayanfe_cart');
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Lazy initializer avoids calling setState inside an effect
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const loading = false;

  // Persist cart on every change
  useEffect(() => {
    localStorage.setItem('ayanfe_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: AddToCartPayload) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        // Bump quantity but keep original addedAt so staleness is tracked from first add
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, addedAt: new Date().toISOString() }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, loading, total }}>
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
