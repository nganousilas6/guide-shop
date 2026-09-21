import { AdminPage } from "@/pages/AdminPage";
import { resetCoreMock, setMockActor } from "@/test/core-mock";
import {
  VipLevelEnum,
  createMockActor,
  makeAdminRow,
  makeConversation,
  makeMessage,
  makeWithdrawal,
  renderWithProviders,
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
      ? options.select({ location: { pathname: "/admin" } })
      : { location: { pathname: "/admin" } },
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

beforeEach(() => {
  resetCoreMock();
  navigate.mockReset();
});

describe("AdminPage accounts", () => {
  it("lists every account with phone, VIP level, balance and online status", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 1n,
          phone: "+2250700000001",
          balance: 5_000n,
          vipLevel: VipLevelEnum.vip1,
          isOnline: true,
        }),
        makeAdminRow({
          id: 2n,
          phone: "+2250700000002",
          balance: 0n,
          vipLevel: VipLevelEnum.vip0,
          isOnline: false,
        }),
      ]),
    });
    setMockActor(actor);
    renderWithProviders(<AdminPage />);

    expect(await screen.findByText("+2250700000001")).toBeInTheDocument();
    expect(screen.getByText("+2250700000002")).toBeInTheDocument();
    expect(screen.getByText("En ligne")).toBeInTheDocument();
    expect(screen.getByText("Hors ligne")).toBeInTheDocument();
    expect(screen.getByText("5 000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("Niveau · VIP1")).toBeInTheDocument();
  });

  it("adds money to an account through the amount dialog", async () => {
    const actor = createMockActor({
      listAccounts: vi
        .fn()
        .mockResolvedValue([makeAdminRow({ id: 7n, phone: "+2250700000007" })]),
      addMoney: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.add_money_button.1"));
    const dialog = await screen.findByTestId("admin.amount_dialog");
    await user.type(within(dialog).getByTestId("admin.amount_input"), "5000");
    await user.click(within(dialog).getByTestId("admin.amount_confirm_button"));

    await waitFor(() => {
      expect(actor.addMoney).toHaveBeenCalledWith(7n, 5000n);
    });
  });

  it("changes a user's VIP level from the account row", async () => {
    const actor = createMockActor({
      listAccounts: vi
        .fn()
        .mockResolvedValue([makeAdminRow({ id: 3n, phone: "+2250700000003" })]),
      setVipLevel: vi
        .fn()
        .mockResolvedValue(
          makeAdminRow({ id: 3n, vipLevel: VipLevelEnum.vip1 }),
        ),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    const select = await screen.findByTestId("admin.vip_select.1");
    await user.selectOptions(select, "vip1");

    await waitFor(() => {
      expect(actor.setVipLevel).toHaveBeenCalledWith(3n, "vip1");
    });
  });
});

describe("AdminPage withdrawals", () => {
  it("approves a pending withdrawal", async () => {
    const actor = createMockActor({
      listPendingWithdrawals: vi
        .fn()
        .mockResolvedValue([makeWithdrawal({ id: 42n, amount: 5_000n })]),
      approveWithdrawal: vi.fn().mockResolvedValue(makeWithdrawal({ id: 42n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.withdrawals"));
    expect(await screen.findByText("5 000 FCFA")).toBeInTheDocument();
    await user.click(screen.getByTestId("admin.approve_button.1"));

    await waitFor(() => {
      expect(actor.approveWithdrawal).toHaveBeenCalledWith(42n);
    });
  });

  it("rejects a pending withdrawal", async () => {
    const actor = createMockActor({
      listPendingWithdrawals: vi
        .fn()
        .mockResolvedValue([makeWithdrawal({ id: 43n })]),
      rejectWithdrawal: vi.fn().mockResolvedValue(makeWithdrawal({ id: 43n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.withdrawals"));
    await user.click(await screen.findByTestId("admin.reject_button.1"));

    await waitFor(() => {
      expect(actor.rejectWithdrawal).toHaveBeenCalledWith(43n);
    });
  });
});

describe("AdminPage service inbox", () => {
  it("shows a user's conversation and replies to it", async () => {
    const actor = createMockActor({
      listConversations: vi.fn().mockResolvedValue([
        makeConversation({
          userId: 5n,
          phone: "+2250700000005",
          lastMessage: "Bonjour",
        }),
      ]),
      listConversationMessages: vi.fn().mockResolvedValue([
        makeMessage({
          id: 1n,
          userId: 5n,
          body: "Bonjour",
          fromAdmin: false,
        }),
      ]),
      replyToUser: vi.fn().mockResolvedValue(
        makeMessage({
          id: 2n,
          userId: 5n,
          body: "Bonjour, comment aider ?",
          fromAdmin: true,
        }),
      ),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.inbox"));
    await user.click(await screen.findByTestId("admin.conversation_item.1"));

    const thread = await screen.findByTestId("admin.conversation_thread");
    expect(within(thread).getByText("Bonjour")).toBeInTheDocument();
    await user.type(
      await screen.findByTestId("admin.reply_input"),
      "Bonjour, comment aider ?",
    );
    await user.click(screen.getByTestId("admin.reply_button"));

    await waitFor(() => {
      expect(actor.replyToUser).toHaveBeenCalledWith(
        5n,
        "Bonjour, comment aider ?",
        null,
      );
    });
  });

  it("shows an empty state when there are no conversations", async () => {
    setMockActor(createMockActor());
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.inbox"));
    expect(await screen.findByText("Aucune conversation")).toBeInTheDocument();
  });
});

describe("AdminPage VIP config", () => {
  it("saves a level's quota and commission rate", async () => {
    const actor = createMockActor({
      listVipConfigs: vi.fn().mockResolvedValue([
        {
          level: VipLevelEnum.vip0,
          dailyTaskQuota: 3n,
          commissionRate: 500n,
        },
      ]),
      setVipConfig: vi.fn().mockResolvedValue({
        level: VipLevelEnum.vip0,
        dailyTaskQuota: 5n,
        commissionRate: 800n,
      }),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.vip"));
    const quota = await screen.findByTestId("admin.vip_quota_input.1");
    await user.clear(quota);
    await user.type(quota, "5");
    const rate = screen.getByTestId("admin.vip_rate_input.1");
    await user.clear(rate);
    await user.type(rate, "800");
    await user.click(screen.getByTestId("admin.vip_save_button.1"));

    await waitFor(() => {
      expect(actor.setVipConfig).toHaveBeenCalledWith("vip0", 5n, 800n);
    });
  });
});
