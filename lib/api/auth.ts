/**
 * Authentication calls.
 *
 * The session lives in an HttpOnly cookie the browser manages. Nothing here
 * stores a token anywhere: there is no localStorage and no sessionStorage, so
 * a token can never be read back out of page script.
 */

import { apiClient, forgetCsrfToken } from "./client";

/** The signed-in person, as the backend sees them. */
export interface CurrentUser {
  id: number;
  username: string;
  /** Email or mobile, whichever they signed up with. */
  identifier: string;
  email: string | null;
  phone_number: string | null;
  first_name: string;
  last_name: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  first_name?: string;
  last_name?: string;
  /** Optional. Recorded once at sign-up; never grants a reward on its own. */
  referral_code?: string;
}

export const authApi = {
  /** Fetches a CSRF cookie. Called before the first state-changing request. */
  csrf: () => apiClient.get<{ detail: string }>("/api/auth/csrf/"),

  login: async (payload: LoginPayload): Promise<CurrentUser> => {
    const user = await apiClient.post<CurrentUser>("/api/auth/login/", payload);
    // Django rotates the CSRF token on sign-in.
    forgetCsrfToken();
    return user;
  },

  register: async (payload: RegisterPayload): Promise<CurrentUser> => {
    const user = await apiClient.post<CurrentUser>("/api/auth/register/", payload);
    forgetCsrfToken();
    return user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post<void>("/api/auth/logout/");
    forgetCsrfToken();
  },

  /**
   * The current user, or `null` when nobody is signed in.
   *
   * This is the only source of truth for "is the user signed in": nothing is
   * cached in the browser, so a stale or edited value cannot fake it.
   */
  me: async (): Promise<CurrentUser | null> => {
    try {
      return await apiClient.get<CurrentUser>("/api/auth/me/");
    } catch {
      return null;
    }
  },
};
