"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import type { Product } from "@/types/product";
import type { SelectedOptions } from "@/lib/pricing";
import { getUnitPrice } from "@/lib/pricing";
import type { CartItem, CartState } from "./types";

type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "remove"; id: string }
  | { type: "setQuantity"; id: string; quantity: number }
  | { type: "clear" };

const initialState: CartState = { items: [] };

/** شناسهٔ یکتای آیتم: محصول + گزینه‌های انتخاب‌شده. */
function buildLineId(productId: string, selectedOptions: SelectedOptions): string {
  const optionSignature = Object.keys(selectedOptions)
    .sort()
    .map((optionId) => `${optionId}:${selectedOptions[optionId]}`)
    .join(",");

  return optionSignature ? `${productId}|${optionSignature}` : productId;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const existing = state.items.find((item) => item.id === action.item.id);

      if (!existing) {
        return { items: [...state.items, action.item] };
      }

      return {
        items: state.items.map((item) =>
          item.id === action.item.id
            ? { ...item, quantity: item.quantity + action.item.quantity }
            : item,
        ),
      };
    }

    case "remove":
      return { items: state.items.filter((item) => item.id !== action.id) };

    case "setQuantity": {
      if (action.quantity <= 0) {
        return { items: state.items.filter((item) => item.id !== action.id) };
      }

      return {
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, quantity: action.quantity } : item,
        ),
      };
    }

    case "clear":
      return initialState;

    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  /** افزودن محصول؛ اگر همان محصول با همان گزینه‌ها موجود باشد، تعداد جمع می‌شود. */
  addItem: (
    product: Product,
    selectedOptions?: SelectedOptions,
    quantity?: number,
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback(
    (product: Product, selectedOptions: SelectedOptions = {}, quantity: number = 1) => {
      const safeOptions = selectedOptions ?? {};
      const id = buildLineId(product.id, safeOptions);

      dispatch({
        type: "add",
        item: {
          id,
          product,
          selectedOptions: safeOptions,
          quantity: Math.max(1, quantity),
          unitPrice: getUnitPrice(product, safeOptions),
        },
      });
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "remove", id });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "setQuantity", id, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const getItemQuantity = useCallback(
    (id: string) => state.items.find((item) => item.id === id)?.quantity ?? 0,
    [state.items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemQuantity,
    }),
    [state.items, addItem, removeItem, updateQuantity, clearCart, getItemQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart باید داخل CartProvider استفاده شود");
  }

  return context;
}

export { buildLineId };
