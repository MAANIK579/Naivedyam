// src/context/CartContext.js
import React, { createContext, useContext, useReducer, useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

const CartContext = createContext(null);
const CART_KEY = 'navedyam_cart';

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state[action.item.id];
      return { ...state, [action.item.id]: { item: action.item, qty: (existing?.qty || 0) + 1 } };
    }
    case 'REMOVE': {
      const existing = state[action.id];
      if (!existing || existing.qty <= 1) {
        const next = { ...state };
        delete next[action.id];
        return next;
      }
      return { ...state, [action.id]: { ...existing, qty: existing.qty - 1 } };
    }
    case 'DELETE': {
      const next = { ...state };
      delete next[action.id];
      return next;
    }
    case 'CLEAR':
      return {};
    case 'RESTORE':
      return action.cart;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, {});
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Restore cart from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then(raw => {
      if (raw) {
        try { dispatch({ type: 'RESTORE', cart: JSON.parse(raw) }); } catch (_) {}
      }
    });
  }, []);

  // Persist cart on every change
  useEffect(() => {
    AsyncStorage.setItem(CART_KEY, JSON.stringify(cart)).catch(() => {});
  }, [cart]);

  const { itemCount, itemTotal } = useMemo(() => {
    let itemCount = 0, itemTotal = 0;
    Object.values(cart).forEach(({ item, qty }) => {
      itemCount += qty;
      itemTotal += item.price * qty;
    });
    return { itemCount, itemTotal };
  }, [cart]);

  const deliveryFee = 30;
  const gst         = parseFloat((itemTotal * 0.05).toFixed(2));
  const discount    = appliedCoupon?.discount || 0;
  const grandTotal  = parseFloat(Math.max(0, itemTotal + deliveryFee + gst - discount).toFixed(2));

  async function applyCoupon(code) {
    if (!code.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const data = await api.validateCoupon(code.trim().toUpperCase(), itemTotal);
      if (data.valid) {
        setAppliedCoupon({ code: code.trim().toUpperCase(), discount: data.discount });
      } else {
        setCouponError(data.message || 'Invalid coupon');
      }
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponError('');
  }

  const addItem    = (item) => dispatch({ type: 'ADD',    item });
  const removeItem = (id)   => dispatch({ type: 'REMOVE', id });
  const deleteItem = (id)   => dispatch({ type: 'DELETE', id });
  const clearCart  = ()     => { dispatch({ type: 'CLEAR' }); removeCoupon(); };
  const getQty     = (id)   => cart[id]?.qty || 0;
  const cartItems  = Object.values(cart);

  return (
    <CartContext.Provider value={{
      cart, cartItems, itemCount, itemTotal,
      deliveryFee, gst, discount, grandTotal,
      appliedCoupon, couponError, couponLoading,
      applyCoupon, removeCoupon,
      addItem, removeItem, deleteItem, clearCart, getQty,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
