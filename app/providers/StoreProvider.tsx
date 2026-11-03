"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "../lib/store";
import { setCartItems } from "../lib/features/cart/cartSlice";


export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const savedCart = localStorage.getItem("rockstar-cart");

    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);

        storeRef.current?.dispatch(setCartItems(cartItems));
      } catch (error) {
        console.error("Failed to restore cart:", error);
      }
    }

    const unsubscribe = storeRef.current?.subscribe(() => {
      const state = storeRef.current?.getState();

      if (state) {
        localStorage.setItem(
          "rockstar-cart",
          JSON.stringify(state.cart.items)
        );
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <Provider store={storeRef.current}>
      {children}
    </Provider>
  );
}