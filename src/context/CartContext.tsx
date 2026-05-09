import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface CartItem {
  id: string;
  name: string;
  market_id: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  loading: boolean;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  // const [loading, setLoading] = useState(false);
  const loading = false;

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ayanfe_cart');
    if (savedCart) {
        setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to local storage on change
  useEffect(() => {
    localStorage.setItem('ayanfe_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: any) => {
    setCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
            return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, loading, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
