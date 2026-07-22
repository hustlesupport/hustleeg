"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getCartAction,
  updateCartItemAction,
  removeCartItemAction,
  saveForLaterAction,
  moveToCartAction,
} from "@/actions/cart";
import type { CartDTO } from "@/lib/cart-dto";

const EMPTY_CART: CartDTO = { id: "", itemCount: 0, subtotal: 0, currency: "EGP", items: [], savedItems: [] };

type CartContextValue = {
  cart: CartDTO;
  isOpen: boolean;
  isLoading: boolean;
  open: () => void;
  close: () => void;
  refresh: () => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  saveForLater: (itemId: string) => Promise<void>;
  moveToCart: (itemId: string) => Promise<{ error?: string }>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDTO>(EMPTY_CART);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    const next = await getCartAction();
    setCart(next);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial cart fetch on mount
    refresh();
  }, [refresh]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      setCart(await updateCartItemAction(itemId, quantity));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      setCart(await removeCartItemAction(itemId));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveForLater = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      setCart(await saveForLaterAction(itemId));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const moveToCart = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      setCart(await moveToCartAction(itemId));
      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not move item to bag." };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isLoading,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        refresh,
        updateQuantity,
        removeItem,
        saveForLater,
        moveToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
