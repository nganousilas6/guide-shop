import { AccountPage } from "@/pages/AccountPage";
import { resetCoreMock, setIdentity, setMockActor } from "@/test/core-mock";
import {
  WithdrawalStatus,
  createMockActor,
  makeAccount,
  makeProgress,
  makeWithdrawal,
  renderWithProviders,
  seedSession,
} from "@/test/harness";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
      ? options.select({ location: { pathname: "/account" } })
      : { location: { pathname: "/account" } },
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

describe("AccountPage withdrawal", () => {
  it("shows the profile card, balance and promo code with a copy button", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(
        makeAccount({
          phone: "+2250700000009",
          balance: 12_000n,
          promoCode: "UNIQUE99",
        }),
      ),
      getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
    });
    setMockActor(actor);
    renderWithProviders(<AccountPage />);

    expect(
      (await screen.findAllByText("+2250700000009")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("12 000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("UNIQUE99")).toBeInTheDocument();
    expect(screen.getByTestId("account.promo.copy_button")).toBeInTheDocument();
  });

  it("blocks a withdrawal while daily tasks are incomplete", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(
          makeProgress({ canStartTask: true, completedToday: 0n }),
        ),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(
      await screen.findByTestId("account.withdraw.open_modal_button"),
    );

    const dialog = await screen.findByTestId("account.withdraw.dialog");
    expect(
      within(dialog).getByTestId("account.withdraw.locked_state"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Vous ne pouvez pas retirer avant d'avoir terminé vos tâches du jour.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByTestId("account.withdraw.submit_button"),
    ).not.toBeInTheDocument();
    expect(actor.requestWithdrawal).not.toHaveBeenCalled();
  });

  it("submits a withdrawal with the secondary password once tasks are complete", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(
          makeProgress({ canStartTask: false, completedToday: 3n }),
        ),
      requestWithdrawal: vi.fn().mockResolvedValue(makeWithdrawal()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(
      await screen.findByTestId("account.withdraw.open_modal_button"),
    );
    await user.type(
      await screen.findByTestId("account.withdraw.amount_input"),
      "5000",
    );
    await user.type(
      screen.getByTestId("account.withdraw.secondary_input"),
      "withdraw1",
    );
    await user.click(screen.getByTestId("account.withdraw.submit_button"));

    await waitFor(() => {
      expect(actor.requestWithdrawal).toHaveBeenCalledWith(5000n, "withdraw1");
    });
    expect(
      await screen.findByTestId("account.withdraw.success_state"),
    ).toBeInTheDocument();
  });

  it("surfaces the backend's daily-task lock message on submit", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(
          makeProgress({ canStartTask: false, completedToday: 3n }),
        ),
      requestWithdrawal: vi
        .fn()
        .mockRejectedValue(new Error("Taches journalieres incompletes")),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(
      await screen.findByTestId("account.withdraw.open_modal_button"),
    );
    await user.type(
      await screen.findByTestId("account.withdraw.amount_input"),
      "2000",
    );
    await user.type(
      screen.getByTestId("account.withdraw.secondary_input"),
      "withdraw1",
    );
    await user.click(screen.getByTestId("account.withdraw.submit_button"));

    expect(
      await screen.findByText(
        "Vous ne pouvez pas retirer avant d'avoir terminé vos tâches du jour.",
      ),
    ).toBeInTheDocument();
  });

  it("surfaces an incorrect secondary password", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(
          makeProgress({ canStartTask: false, completedToday: 3n }),
        ),
      requestWithdrawal: vi
        .fn()
        .mockRejectedValue(new Error("Mot de passe secondaire incorrect")),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(
      await screen.findByTestId("account.withdraw.open_modal_button"),
    );
    await user.type(
      await screen.findByTestId("account.withdraw.amount_input"),
      "2000",
    );
    await user.type(
      screen.getByTestId("account.withdraw.secondary_input"),
      "wrongpass",
    );
    await user.click(screen.getByTestId("account.withdraw.submit_button"));

    expect(
      await screen.findByText("Mot de passe actuel incorrect."),
    ).toBeInTheDocument();
  });

  it("lists withdrawal history with its status", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
      listMyWithdrawals: vi.fn().mockResolvedValue([
        makeWithdrawal({ id: 1n, amount: 5_000n }),
        makeWithdrawal({
          id: 2n,
          amount: 2_000n,
          status: WithdrawalStatus.approved,
        }),
      ]),
    });
    setMockActor(actor);
    renderWithProviders(<AccountPage />);

    expect(await screen.findByText("En attente")).toBeInTheDocument();
    expect(screen.getByText("Approuvé")).toBeInTheDocument();
    const list = screen.getByTestId("account.withdraw.list");
    expect(within(list).getByText("5 000 FCFA")).toBeInTheDocument();
    expect(within(list).getByText("2 000 FCFA")).toBeInTheDocument();
  });
});
