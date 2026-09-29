"use client";

/**
 * Who is signed in, according to the backend.
 *
 * The answer is never cached in storage. It is fetched from `/api/auth/me/`
 * and held in React state for the lifetime of the page, so there is nothing in
 * the browser an attacker can edit to look signed in. A refresh asks the
 * backend again.
 */

import { useCallback, useEffect, useState } from "react";

import { authApi, type CurrentUser } from "./auth";

interface AuthState {
  user: CurrentUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setUser(await authApi.me());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return { user, isLoading, refresh, signOut };
}
