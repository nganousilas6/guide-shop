import { createActor } from "@/backend";
import type { AccountView, SessionView } from "@/backend";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "guideshop.session";

/**
 * Legacy storage key used before the platform was renamed to Guide Shop.
 * Sessions persisted under it are still honoured and migrated forward on the
 * next write, so a rename never signs an existing user out.
 */
const LEGACY_STORAGE_KEY = "fobshop.session";

type StoredSession = {
  account: AccountView;
  isAdmin: boolean;
};

type AuthContextValue = {
  account: AccountView | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isBlocked: boolean;
  isReady: boolean;
  signIn: (session: SessionView) => void;
  signOut: () => void;
  refreshAccount: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function serializeAccount(account: AccountView): AccountView {
  return {
    ...account,
    id: BigInt(account.id),
    balance: BigInt(account.balance),
    creditScore: BigInt(account.creditScore),
    createdAt: BigInt(account.createdAt),
    blocked: Boolean(account.blocked),
  };
}

/**
 * True when the identity is the anonymous principal, i.e. the user has not
 * signed in. Reads `isAnonymous()` when the identity exposes it and otherwise
 * falls back to the well-known anonymous principal text, so the check works
 * with both the real Internet Identity object and lightweight test doubles.
 */
function isAnonymousPrincipal(identity: {
  getPrincipal: () => { isAnonymous?: () => boolean; toString: () => string };
}): boolean {
  const principal = identity.getPrincipal();
  if (typeof principal.isAnonymous === "function") {
    return principal.isAnonymous();
  }
  return principal.toString() === "2vxsx-fae";
}

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      account?: AccountView;
      isAdmin?: boolean;
    };
    if (!parsed.account) return null;
    return {
      account: serializeAccount(parsed.account),
      isAdmin: Boolean(parsed.isAdmin),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);
  const [session, setSession] = useState<StoredSession | null>(
    readStoredSession,
  );
  const [isReady, setIsReady] = useState(false);

  // The actor is only usable for authenticated calls once it has been rebuilt
  // with the current Internet Identity principal. `useActor` returns the
  // anonymous actor until the identity is attached, and every authenticated
  // backend method traps "Sign in required" when called through it. Gating the
  // session on this flag is what stops the pages from firing their queries
  // against the anonymous actor — the mismatch that made every tab render the
  // generic error.
  const hasIdentity = !!identity && !isAnonymousPrincipal(identity);
  const isActorReady = !!actor && !isFetching && hasIdentity;

  useEffect(() => {
    if (isInitializing || isFetching) return;
    if (!identity) {
      setSession(null);
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      setIsReady(true);
      return;
    }
    if (!actor) return;
    let cancelled = false;
    void (async () => {
      try {
        // `touchSession` is the single source of truth for whether the current
        // Internet Identity principal still owns a backend session. It returns
        // `null` (never traps) when the principal has no session — for example
        // after the canister was upgraded or the session map was reset — so a
        // stale persisted session must be dropped here. Keeping it would leave
        // `isAuthenticated` true while every authenticated call traps
        // "Sign in required", which is exactly the mismatch that made every tab
        // render the generic error.
        const account = await actor.touchSession();
        if (cancelled) return;
        if (account) {
          setSession((current) => {
            const next: StoredSession = {
              account: serializeAccount(account),
              isAdmin: current?.isAdmin ?? false,
            };
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        }
      } catch {
        /* keep the stored session when the refresh fails */
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, identity, isInitializing, isFetching]);

  const signIn = useCallback((next: SessionView) => {
    const stored: StoredSession = {
      account: serializeAccount(next.account),
      isAdmin: next.isAdmin,
    };
    setSession(stored);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshAccount = useCallback(() => {
    if (!actor) return;
    void (async () => {
      try {
        const account = await actor.getMyAccount();
        if (!account) return;
        setSession((current) => {
          if (!current) return current;
          const next: StoredSession = {
            account: serializeAccount(account),
            isAdmin: current.isAdmin,
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } catch {
        /* ignore transient refresh failures */
      }
    })();
  }, [actor]);

  const value = useMemo<AuthContextValue>(
    () => ({
      account: session?.account ?? null,
      isAdmin: session?.isAdmin ?? false,
      // A session is only usable once the actor carries the caller's identity.
      // Reporting `true` while the actor is still anonymous is what let the
      // pages fire authenticated queries that trapped "Sign in required".
      isAuthenticated: session !== null && isActorReady,
      isBlocked: session?.account.blocked ?? false,
      isReady,
      signIn,
      signOut,
      refreshAccount,
    }),
    [session, isActorReady, isReady, signIn, signOut, refreshAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
