import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { resetCoreMock, setIdentity, setMockActor } from "@/test/core-mock";
import {
  createMockActor,
  createTestQueryClient,
  makeAccount,
  makeProgress,
  makeRecord,
  seedSession,
} from "@/test/harness";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization of the session/identity contract that the accepted
 * "fix the root cause once, centrally" requirement must preserve.
 *
 * The reported bug is that every authenticated backend call failed because the
 * session and the caller identity disagreed. These tests freeze the *working*
 * half of that contract — a persisted session survives a refresh, a missing
 * identity clears it, and the five tabs render their real data once the actor
 * is available — so a central fix cannot silently regress them.
 *
 * They deliberately do NOT assert the old "Fob Shop" branding, the old
 * localStorage key names, or the generic "Une erreur est survenue" behavior,
 * all of which the accepted request intentionally changes.
 */

vi.mock("@caffeineai/core-infrastructure", async () => {
  const { coreInfrastructureMock } = await import("@/test/core-mock");
  return coreInfrastructureMock();
});

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useRouterState: (options?: {
    select?: (state: { location: { pathname: string } }) => unknown;
  }) =>
    options?.select
      ? options.select({ location: { pathname: "/" } })
      : { location: { pathname: "/" } },
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

beforeEach(() => {
  resetCoreMock();
  navigate.mockReset();
});

function AuthProbe() {
  const { isAuthenticated, isReady, account, isAdmin } = useAuth();
  return (
    <div>
      <span data-ocid="probe.ready">{String(isReady)}</span>
      <span data-ocid="probe.auth">{String(isAuthenticated)}</span>
      <span data-ocid="probe.phone">{account?.phone ?? "none"}</span>
      <span data-ocid="probe.admin">{String(isAdmin)}</span>
    </div>
  );
}

function renderAuthProbe() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <I18nProvider>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("session persistence across a refresh", () => {
  it("keeps a stored session authenticated after a remount", async () => {
    setIdentity({ getPrincipal: () => ({ toString: () => "test-user" }) });
    setMockActor(
      createMockActor({
        touchSession: vi.fn().mockResolvedValue(makeAccount()),
      }),
    );
    seedSession(makeAccount({ phone: "+2250700000001" }));

    const first = renderAuthProbe();
    await waitFor(() => {
      expect(screen.getByTestId("probe.ready")).toHaveTextContent("true");
    });
    expect(screen.getByTestId("probe.auth")).toHaveTextContent("true");
    expect(screen.getByTestId("probe.phone")).toHaveTextContent(
      "+2250700000001",
    );
    first.unmount();

    // A refresh re-mounts the provider with the same persisted session.
    renderAuthProbe();
    await waitFor(() => {
      expect(screen.getByTestId("probe.ready")).toHaveTextContent("true");
    });
    expect(screen.getByTestId("probe.auth")).toHaveTextContent("true");
    expect(screen.getByTestId("probe.phone")).toHaveTextContent(
      "+2250700000001",
    );
  });

  it("keeps the stored session when the touchSession refresh fails", async () => {
    setIdentity({ getPrincipal: () => ({ toString: () => "test-user" }) });
    setMockActor(
      createMockActor({
        touchSession: vi.fn().mockRejectedValue(new Error("Sign in required")),
      }),
    );
    seedSession(makeAccount({ phone: "+2250700000009" }));

    renderAuthProbe();

    await waitFor(() => {
      expect(screen.getByTestId("probe.ready")).toHaveTextContent("true");
    });
    // A transient refresh failure must not sign the user out.
    expect(screen.getByTestId("probe.auth")).toHaveTextContent("true");
    expect(screen.getByTestId("probe.phone")).toHaveTextContent(
      "+2250700000009",
    );
  });

  it("clears the session when there is no identity", async () => {
    setIdentity(null);
    setMockActor(createMockActor());
    seedSession(makeAccount());

    renderAuthProbe();

    await waitFor(() => {
      expect(screen.getByTestId("probe.ready")).toHaveTextContent("true");
    });
    expect(screen.getByTestId("probe.auth")).toHaveTextContent("false");
    expect(screen.getByTestId("probe.phone")).toHaveTextContent("none");
  });

  it("preserves the admin flag across a refresh", async () => {
    setIdentity({ getPrincipal: () => ({ toString: () => "admin-user" }) });
    setMockActor(
      createMockActor({
        touchSession: vi.fn().mockResolvedValue(makeAccount({ id: 0n })),
      }),
    );
    seedSession(makeAccount({ id: 0n, phone: "silas1234" }), true);

    renderAuthProbe();

    await waitFor(() => {
      expect(screen.getByTestId("probe.ready")).toHaveTextContent("true");
    });
    expect(screen.getByTestId("probe.admin")).toHaveTextContent("true");
  });
});

/* ------------------------------------------------------------------ */
/* The five tabs render their real data once the actor is available    */
/* ------------------------------------------------------------------ */

describe("authenticated tabs render real content", () => {
  it("renders each tab's own data instead of a generic error", async () => {
    setIdentity({ getPrincipal: () => ({ toString: () => "test-user" }) });
    seedSession();
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount()),
      getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
      listCommissions: vi.fn().mockResolvedValue([]),
      listRecords: vi.fn().mockResolvedValue([makeRecord()]),
      listMyMessages: vi.fn().mockResolvedValue([]),
      listMyWithdrawals: vi.fn().mockResolvedValue([]),
    });
    setMockActor(actor);

    const { HomePage } = await import("@/pages/HomePage");
    const { RecordsPage } = await import("@/pages/RecordsPage");
    const { StartPage } = await import("@/pages/StartPage");
    const { ServicePage } = await import("@/pages/ServicePage");
    const { AccountPage } = await import("@/pages/AccountPage");

    const pages = [
      { name: "Accueil", Page: HomePage, marker: "home.page" },
      { name: "Enregistrements", Page: RecordsPage, marker: "records.list" },
      { name: "Démarrage", Page: StartPage, marker: "start.markets_section" },
      { name: "Service", Page: ServicePage, marker: "service.message_list" },
      { name: "Compte", Page: AccountPage, marker: "account.page" },
    ] as const;

    for (const { name, Page, marker } of pages) {
      const view = render(
        <QueryClientProvider client={createTestQueryClient()}>
          <I18nProvider>
            <AuthProvider>
              <Page />
            </AuthProvider>
          </I18nProvider>
        </QueryClientProvider>,
      );

      expect(
        await screen.findByTestId(marker),
        `${name} should render its real content`,
      ).toBeInTheDocument();
      // The generic error card must not be the tab's content.
      expect(
        screen.queryByTestId("error_state"),
        `${name} should not show the generic error state`,
      ).not.toBeInTheDocument();

      view.unmount();
    }
  });
});
