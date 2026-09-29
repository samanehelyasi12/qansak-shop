"use client";

import { useEffect, useSyncExternalStore } from "react";

import { accountSession, type AccountSession } from "./session";

/**
 * The signed-in customer, shared by the header and the account panel.
 *
 * `useSyncExternalStore` is used rather than `useState` + `useEffect` so the
 * store is the single source of truth and every reader sees the same value.
 * The session itself is fetched once, from whichever component mounts first.
 */
export function useAccountSession(): AccountSession {
  const session = useSyncExternalStore(
    accountSession.subscribe,
    accountSession.get,
    accountSession.get,
  );

  useEffect(() => {
    void accountSession.ensureRead();
  }, []);

  return session;
}
