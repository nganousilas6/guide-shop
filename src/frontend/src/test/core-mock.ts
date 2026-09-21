import type { MockActor } from "@/test/harness";
import { vi } from "vitest";

/**
 * Mutable holder the `@caffeineai/core-infrastructure` module mock reads from.
 *
 * `vi.mock` is hoisted above imports, so the factory cannot close over a
 * per-test variable directly. Tests call `setMockActor` / `setIdentity` before
 * rendering and the mocked hooks read the current values.
 */
export const coreMockState: {
  actor: MockActor | null;
  isFetching: boolean;
  identity: { getPrincipal: () => { toString: () => string } } | null;
  isInitializing: boolean;
} = {
  actor: null,
  isFetching: false,
  identity: null,
  isInitializing: false,
};

export function setMockActor(actor: MockActor | null): void {
  coreMockState.actor = actor;
  coreMockState.isFetching = false;
}

export function setIdentity(
  identity: { getPrincipal: () => { toString: () => string } } | null,
): void {
  coreMockState.identity = identity;
}

export function resetCoreMock(): void {
  coreMockState.actor = null;
  coreMockState.isFetching = false;
  coreMockState.identity = null;
  coreMockState.isInitializing = false;
}

/**
 * The module factory for `vi.mock("@caffeineai/core-infrastructure", ...)`.
 * Import it inside the hoisted factory via `vi.hoisted` or inline.
 */
export function coreInfrastructureMock() {
  return {
    useActor: () => ({
      actor: coreMockState.actor,
      isFetching: coreMockState.isFetching,
    }),
    useInternetIdentity: () => ({
      identity: coreMockState.identity,
      login: vi.fn(),
      clear: vi.fn(),
      loginStatus: "idle" as const,
      isInitializing: coreMockState.isInitializing,
      isLoginIdle: true,
      isLoggingIn: false,
      isLoginSuccess: false,
      isLoginError: false,
      isAuthenticated: coreMockState.identity !== null,
    }),
    InternetIdentityProvider: ({ children }: { children: unknown }) => children,
    createActorWithConfig: vi.fn(),
    loadConfig: vi.fn(),
    loadMockBackendFromModules: vi.fn(),
  };
}
