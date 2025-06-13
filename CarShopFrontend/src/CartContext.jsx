import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import config from './config';
import { useAuth } from './hooks/useAuth';
import CarOperationsContext from './CarOperationsContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, getAuthToken, currentUser } = useAuth();
  const { lastWebSocketMessage } = useContext(CarOperationsContext);

  // Get cart data
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated()) {
      setCart(null);
      setCartCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      const response = await axios.get(`${config.API_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCart(response.data.cart);
      setCartCount(response.data.itemCount);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError(error.response?.data?.message || 'Failed to fetch cart');
      setCart(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthToken]);

  // Get cart count only (for navbar badge)
  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated()) {
      setCartCount(0);
      return;
    }

    try {
      const token = getAuthToken();
      const response = await axios.get(`${config.API_URL}/api/cart/count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCartCount(response.data.itemCount);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  }, [isAuthenticated, getAuthToken]);

  // Add item to cart
  const addToCart = useCallback(async (carId) => {
    if (!isAuthenticated()) {
      throw new Error('Please log in to add items to cart');
    }

    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      const response = await axios.post(`${config.API_URL}/api/cart/items`, 
        { carId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setCart(response.data.cart);
      setCartCount(response.data.itemCount);
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to add item to cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthToken]);

  // Remove item from cart
  const removeFromCart = useCallback(async (carId) => {
    if (!isAuthenticated()) {
      throw new Error('Please log in to modify cart');
    }

    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      const response = await axios.delete(`${config.API_URL}/api/cart/items/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCart(response.data.cart);
      setCartCount(response.data.itemCount);
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to remove item from cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthToken]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!isAuthenticated()) {
      throw new Error('Please log in to modify cart');
    }

    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      const response = await axios.delete(`${config.API_URL}/api/cart/clear`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCart(response.data.cart);
      setCartCount(0);
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to clear cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthToken]);
  // Fetch cart count on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated()) {
      fetchCartCount();
    } else {
      setCart(null);
      setCartCount(0);
    }
  }, [isAuthenticated, fetchCartCount]);

  // Listen for WebSocket cart updates
  useEffect(() => {
    if (lastWebSocketMessage && isAuthenticated() && currentUser) {
      try {
        const message = typeof lastWebSocketMessage === 'string' 
          ? JSON.parse(lastWebSocketMessage) 
          : lastWebSocketMessage;

        if (message.type === 'CART_UPDATED' && message.data?.userId === currentUser.id) {
          console.log('Cart updated via WebSocket:', message.data);
          // Update cart count from WebSocket message
          if (typeof message.data.itemCount === 'number') {
            setCartCount(message.data.itemCount);
          }
          // Optionally refresh full cart data
          if (cart) {
            fetchCart();
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket cart update:', error);
      }
    }
  }, [lastWebSocketMessage, isAuthenticated, currentUser, cart, fetchCart]);

  const value = {
    cart,
    cartCount,
    loading,
    error,
    fetchCart,
    fetchCartCount,
    addToCart,
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
