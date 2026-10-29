import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setSubtotal(0);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCartItems(res.data.items || []);
      setSubtotal(parseFloat(res.data.subtotal || 0));
    } catch (err) {
      console.warn('Could not fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      throw new Error('Please log in to add items to your cart.');
    }
    const res = await api.post('/cart/add', { product_id: productId, quantity });
    await fetchCart();
    return res.data;
  };

  const updateQuantity = async (cartItemId, quantity) => {
    const res = await api.put(`/cart/items/${cartItemId}`, { quantity });
    await fetchCart();
    return res.data;
  };

  const removeItem = async (cartItemId) => {
    const res = await api.delete(`/cart/items/${cartItemId}`);
    await fetchCart();
    return res.data;
  };

  const clearCart = async () => {
    const res = await api.delete('/cart');
    setCartItems([]);
    setSubtotal(0);
    return res.data;
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

