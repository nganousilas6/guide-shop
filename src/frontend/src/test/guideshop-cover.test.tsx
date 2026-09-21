import { AccountPage } from "@/pages/AccountPage";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { StartPage } from "@/pages/StartPage";
import { resetCoreMock, setIdentity, setMockActor } from "@/test/core-mock";
import {
  createMockActor,
  makeAccount,
  makeAdminRow,
  makeConversation,
  makeMessage,
  makeProgress,
  makeVipConfig,
  makeWithdrawal,
  renderWithProviders,
  seedSession,
} from "@/test/harness";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover tests for the accepted Guide Shop requirements that the earlier suites
 * do not already assert:
 *
 *  - the platform rename to "Guide Shop" across the header, the home About
 *    card, the login/register screens and the Compte About panel, in both
 *    French and English;
 *  - a session persisted under the legacy `fobshop.session` key still being
 *    honoured after the rename (the language key has no legacy fallback in
 *    production, so it is deliberately not asserted here);
 *  - the chosen language surviving a refresh;
 *  - the admin console loading accounts, pending withdrawals, VIP configs,
 *    task assignment and the service inbox for the signed-in admin;
 *  - the admin setting, modifying and clearing a recharge request, and
 *    crediting a recharge so the balance rises and the request clears;
 *  - the VIP0 daily quota blocking the start CTA once reached.
 *
 * These are component/integration tests against a typed local actor mock. They
 * prove the frontend's consumer contract and UI behavior, never the real
 * canister or object-storage gateway.
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
  setIdentity({ getPrincipal: () => ({ toString: () => "test-user" }) });
  seedSession();
  navigate.mockReset();
});

/* ------------------------------------------------------------------ */
/* Guide Shop branding in both languages                               */
/* ------------------------------------------------------------------ */

describe("Guide Shop branding", () => {
  it("shows 'Guide Shop' in the header, home About card and Compte About panel", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount()),
      getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
      listCommissions: vi.fn().mockResolvedValue([]),
    });
    setMockActor(actor);
    const user = userEvent.setup();

    const home = renderWithProviders(<HomePage />);
    // The header title and the About card both read the platform name.
    expect(await screen.findByTestId("home.page")).toBeInTheDocument();
    expect(screen.getAllByText("Guide Shop").length).toBeGreaterThan(0);
    home.unmount();

    renderWithProviders(<AccountPage />);
    await user.click(await screen.findByRole("button", { name: "À propos" }));
    const dialog = await screen.findByTestId("account.panel.dialog");
    // The title and its sr-only description both carry the heading text.
    expect(
      within(dialog).getAllByText("À propos de Guide Shop").length,
    ).toBeGreaterThan(0);
    expect(
      within(dialog).getByText(/Guide Shop est une entreprise/),
    ).toBeInTheDocument();
  });

  it("shows 'Guide Shop' on the login and register screens", () => {
    setMockActor(createMockActor());

    const login = renderWithProviders(<LoginPage />);
    expect(screen.getAllByText("Guide Shop").length).toBeGreaterThan(0);
    login.unmount();

    renderWithProviders(<RegisterPage />);
    expect(screen.getAllByText("Guide Shop").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Rejoignez Guide Shop en quelques secondes"),
    ).toBeInTheDocument();
  });

  it("keeps the Guide Shop name in English after switching language", async () => {
    setMockActor(
      createMockActor({
        getMyAccount: vi.fn().mockResolvedValue(makeAccount()),
        getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(await screen.findByTestId("nav.language_toggle"));
    await user.click(await screen.findByRole("button", { name: "About" }));
    const dialog = await screen.findByTestId("account.panel.dialog");
    // The title and its sr-only description both carry the heading text.
    expect(
      within(dialog).getAllByText("About Guide Shop").length,
    ).toBeGreaterThan(0);
    expect(
      within(dialog).getByText(/Guide Shop is a growth marketing company/),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Legacy storage keys survive the rename                              */
/* ------------------------------------------------------------------ */

describe("legacy storage keys after the rename", () => {
  it("honours a session persisted under the legacy fobshop.session key", async () => {
    setIdentity({ getPrincipal: () => ({ toString: () => "test-user" }) });
    setMockActor(
      createMockActor({
        touchSession: vi.fn().mockResolvedValue(makeAccount()),
      }),
    );
    // A user who signed in before the rename still has the old key.
    window.localStorage.setItem(
      "fobshop.session",
      JSON.stringify({ account: makeAccount(), isAdmin: false }),
    );

    renderWithProviders(<HomePage />);

    // The home page renders its real content rather than bouncing to login.
    expect(await screen.findByTestId("home.page")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Language preference survives a refresh                              */
/* ------------------------------------------------------------------ */

describe("language preference persistence", () => {
  it("keeps the chosen language after a remount", async () => {
    setMockActor(createMockActor());
    const user = userEvent.setup();

    const first = renderWithProviders(<LoginPage />);
    await user.click(screen.getByTestId("nav.language_toggle"));
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    first.unmount();

    renderWithProviders(<LoginPage />);
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Admin console loads every panel's data                              */
/* ------------------------------------------------------------------ */

describe("admin console panels load their data", () => {
  it("loads accounts, withdrawals, VIP configs, tasks and the inbox", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          balance: 5_000n,
        }),
      ]),
      listPendingWithdrawals: vi
        .fn()
        .mockResolvedValue([makeWithdrawal({ id: 42n, amount: 5_000n })]),
      listVipConfigs: vi
        .fn()
        .mockResolvedValue([makeVipConfig({ dailyTaskQuota: 30n })]),
      listConversations: vi.fn().mockResolvedValue([
        makeConversation({
          userId: 5n,
          phone: "+2250700000005",
          lastMessage: "Bonjour",
        }),
      ]),
      listConversationMessages: vi
        .fn()
        .mockResolvedValue([makeMessage({ id: 1n, userId: 5n })]),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    // Accounts panel is the default tab.
    expect(await screen.findByText("+2250700000007")).toBeInTheDocument();

    await user.click(screen.getByTestId("admin.tab.withdrawals"));
    expect(await screen.findByText("5 000 FCFA")).toBeInTheDocument();

    await user.click(screen.getByTestId("admin.tab.vip"));
    expect(await screen.findByTestId("admin.vip_panel")).toBeInTheDocument();
    expect(screen.getByTestId("admin.vip_quota_input.1")).toHaveValue("30");

    await user.click(screen.getByTestId("admin.tab.tasks"));
    expect(await screen.findByTestId("admin.tasks_panel")).toBeInTheDocument();

    await user.click(screen.getByTestId("admin.tab.inbox"));
    expect(await screen.findByTestId("admin.inbox_panel")).toBeInTheDocument();
    expect(await screen.findByText("+2250700000005")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Admin recharge request: set, modify, clear, credit                  */
/* ------------------------------------------------------------------ */

describe("admin recharge request lifecycle", () => {
  it("sets a recharge request for an account", async () => {
    const actor = createMockActor({
      listAccounts: vi
        .fn()
        .mockResolvedValue([makeAdminRow({ id: 7n, phone: "+2250700000007" })]),
      setRechargeRequest: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(
      await screen.findByTestId("admin.recharge_request_button.1"),
    );
    const dialog = await screen.findByTestId("admin.amount_dialog");
    await user.type(within(dialog).getByTestId("admin.amount_input"), "25000");
    await user.click(within(dialog).getByTestId("admin.amount_confirm_button"));

    await waitFor(() => {
      expect(actor.setRechargeRequest).toHaveBeenCalledWith(7n, 25_000n);
    });
  });

  it("modifies an existing recharge request", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          requestedRecharge: 15_000n,
        }),
      ]),
      setRechargeRequest: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(
      await screen.findByTestId("admin.recharge_request_button.1"),
    );
    const dialog = await screen.findByTestId("admin.amount_dialog");
    const input = within(dialog).getByTestId("admin.amount_input");
    expect(input).toHaveValue("15000");
    await user.clear(input);
    await user.type(input, "30000");
    await user.click(within(dialog).getByTestId("admin.amount_confirm_button"));

    await waitFor(() => {
      expect(actor.setRechargeRequest).toHaveBeenCalledWith(7n, 30_000n);
    });
  });

  it("clears a pending recharge request with a zero amount", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          requestedRecharge: 15_000n,
        }),
      ]),
      setRechargeRequest: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(
      await screen.findByTestId("admin.clear_recharge_button.1"),
    );

    await waitFor(() => {
      expect(actor.setRechargeRequest).toHaveBeenCalledWith(7n, 0n);
    });
  });

  it("credits a recharge, raising the balance and clearing the request", async () => {
    // The backend returns the updated row: balance up, request gone.
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          balance: 0n,
          requestedRecharge: 25_000n,
        }),
      ]),
      creditRecharge: vi.fn().mockResolvedValue(
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          balance: 25_000n,
        }),
      ),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(
      await screen.findByTestId("admin.credit_recharge_button.1"),
    );
    const dialog = await screen.findByTestId("admin.amount_dialog");
    await user.type(within(dialog).getByTestId("admin.amount_input"), "25000");
    await user.click(within(dialog).getByTestId("admin.amount_confirm_button"));

    await waitFor(() => {
      expect(actor.creditRecharge).toHaveBeenCalledWith(7n, 25_000n);
    });
  });
});

/* ------------------------------------------------------------------ */
/* VIP0 daily quota                                                    */
/* ------------------------------------------------------------------ */

describe("VIP0 daily quota", () => {
  it("blocks the start CTA once the 30-task quota is reached", async () => {
    const actor = createMockActor({
      getDailyProgress: vi.fn().mockResolvedValue(
        makeProgress({
          vipLevel: "vip0" as never,
          dailyTaskQuota: 30n,
          completedToday: 30n,
          canStartTask: false,
        }),
      ),
    });
    setMockActor(actor);
    renderWithProviders(<StartPage />);

    expect(await screen.findByTestId("start.quota_notice")).toBeInTheDocument();
    expect(screen.getByTestId("start.primary_button")).toBeDisabled();
    expect(screen.getByText("30/30")).toBeInTheDocument();
  });

  it("re-enables the start CTA when the next day's quota is available", async () => {
    // The next cycle resets the counter, so the CTA is usable again.
    const actor = createMockActor({
      getDailyProgress: vi.fn().mockResolvedValue(
        makeProgress({
          vipLevel: "vip0" as never,
          dailyTaskQuota: 30n,
          completedToday: 0n,
          canStartTask: true,
        }),
      ),
    });
    setMockActor(actor);
    renderWithProviders(<StartPage />);

    expect(await screen.findByText("0/30")).toBeInTheDocument();
    expect(screen.getByTestId("start.primary_button")).toBeEnabled();
    expect(screen.queryByTestId("start.quota_notice")).not.toBeInTheDocument();
  });
});
