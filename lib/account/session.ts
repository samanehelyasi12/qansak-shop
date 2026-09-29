/**
 * Who is signed in, in one place.
 *
 * This is a small external store rather than a React context so the header and
 * the panel read the same value without the provider having to be threaded
 * through `app/layout.tsx` — a page that does not care about the account is
 * left untouched.
 *
 * The starting point is "nobody". A name appears here only because the backend
 * said there is a session, so there is nothing in the browser a person can edit
 * to look signed in. `read` is what asks; the sign-in form calls `signIn` so
 * the header can show the name on the very next paint.
 */

import { authApi, type CurrentUser } from "@/lib/api/auth";

import { MOCK_ACCOUNT_USER } from "./mock";
import type { AccountUser } from "./types";

export type AccountSessionStatus = "loading" | "authenticated" | "anonymous";

export interface AccountSession {
  status: AccountSessionStatus;
  user: AccountUser | null;
  /**
   * True only while the placeholder customer from `mock.ts` is being shown
   * instead of a real session. The panel says so rather than passing the
   * placeholder records off as real orders.
   */
  isPreview: boolean;
}

/** The session endpoint says who someone is, and nothing more. */
function toAccountUser(current: CurrentUser): AccountUser {
  const firstName = current.first_name ?? "";
  const lastName = current.last_name ?? "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: current.id,
    firstName,
    lastName,
    // A person with no name on file still needs something on the button.
    displayName: displayName || current.username || current.identifier,
    email: current.email,
    phone: current.phone_number,
    // Not carried by the session: the panel hides them rather than inventing.
    memberSince: null,
    referralCode: null,
    loyaltyPoints: null,
  };
}

function anonymousSession(): AccountSession {
  return { status: "anonymous", user: null, isPreview: false };
}

function previewSession(): AccountSession {
  return { status: "authenticated", user: MOCK_ACCOUNT_USER, isPreview: true };
}

let snapshot: AccountSession = anonymousSession();

const listeners = new Set<() => void>();

function publish(next: AccountSession) {
  snapshot = next;
  // A new object so React sees the change rather than the same reference.
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AccountSession {
  return snapshot;
}

/**
 * Asks the backend who is signed in and publishes the answer. Nobody here
 * decides the outcome: a session that comes back is the only thing that can
 * make this `authenticated`.
 */
async function read(): Promise<void> {
  if (snapshot.status === "loading") return;

  publish({ status: "loading", user: null, isPreview: snapshot.isPreview });

  const current = await authApi.me();
  publish(
    current
      ? { status: "authenticated", user: toAccountUser(current), isPreview: false }
      : anonymousSession(),
  );
}

let readPromise: Promise<void> | null = null;

export const accountSession = {
  subscribe,
  get: getSnapshot,

  /**
   * Reads the session, at most once per page.
   *
   * The header and the panel both need it, and asking twice would be two
   * requests for one answer. The result is kept so a later consumer gets it
   * from the store rather than the network.
   */
  ensureRead(): Promise<void> {
    readPromise ??= read();
    return readPromise;
  },

  /** Records a completed sign-in, so the header can show the name right away. */
  signIn(current: CurrentUser): void {
    publish({ status: "authenticated", user: toAccountUser(current), isPreview: false });
  },

  /** Ends the session on the backend, then here. Never leaves the name behind. */
  async signOut(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      // Whether or not the call went through, this browser must stop showing
      // somebody else's name.
      readPromise = null;
      publish(anonymousSession());
    }
  },

  /**
   * Shows the placeholder customer, for looking at the panel before the
   * records are connected. Reachable only from an explicit button.
   */
  restorePreview(): void {
    publish(previewSession());
  },
};
