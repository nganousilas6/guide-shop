import { HomePage } from "@/pages/HomePage";
import { RecordsPage } from "@/pages/RecordsPage";
import { StartPage } from "@/pages/StartPage";
import { resetCoreMock, setIdentity, setMockActor } from "@/test/core-mock";
import {
  RecordStatusEnum,
  VipLevelEnum,
  createMockActor,
  makeCommission,
  makeProgress,
  makeRecord,
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

describe("HomePage", () => {
  it("renders the carousel, the About card and the commission list in FCFA", async () => {
    const actor = createMockActor({
      listCommissions: vi
        .fn()
        .mockResolvedValue([
          makeCommission({ id: 1n, amount: 500n, source: "Tache journaliere" }),
        ]),
    });
    setMockActor(actor);
    renderWithProviders(<HomePage />);

    expect(screen.getByTestId("home.carousel")).toBeInTheDocument();
    expect(screen.getByText("À propos")).toBeInTheDocument();
    expect(await screen.findByText("Tache journaliere")).toBeInTheDocument();
    expect(screen.getByText("+500 FCFA")).toBeInTheDocument();
  });

  it("shows an empty commission state with a call to action", async () => {
    setMockActor(createMockActor());
    renderWithProviders(<HomePage />);

    expect(
      await screen.findByText("Aucune commission pour le moment"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("home.commission_cta")).toBeInTheDocument();
  });
});

describe("RecordsPage", () => {
  it("lists records as cards and filters by tab", async () => {
    const actor = createMockActor({
      listRecords: vi.fn().mockImplementation((status: string | null) => {
        if (status === RecordStatusEnum.soumission) {
          return Promise.resolve([
            makeRecord({
              id: 2n,
              status: RecordStatusEnum.soumission,
              merchant: "Marchand Soumis",
            }),
          ]);
        }
        return Promise.resolve([
          makeRecord({ id: 1n, merchant: "Marchand Termine" }),
        ]);
      }),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RecordsPage />);

    expect(await screen.findByText("Marchand Termine")).toBeInTheDocument();
    expect(screen.getByTestId("records.filter.tab.all")).toBeInTheDocument();
    expect(
      screen.getByTestId("records.filter.tab.soumission"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("records.filter.tab.termine"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("records.filter.tab.frozen")).toBeInTheDocument();

    await user.click(screen.getByTestId("records.filter.tab.soumission"));
    expect(await screen.findByText("Marchand Soumis")).toBeInTheDocument();
    await waitFor(() => {
      expect(actor.listRecords).toHaveBeenCalledWith("soumission", 50n, null);
    });
  });

  it("opens a record's detail modal", async () => {
    const actor = createMockActor({
      listRecords: vi.fn().mockResolvedValue([
        makeRecord({
          id: 9n,
          merchant: "Boutique Detail",
          productDescription: "Un produit detaille",
          totalValue: 7_500n,
          commission: 750n,
        }),
      ]),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RecordsPage />);

    await user.click(await screen.findByTestId("records.item.1"));

    const modal = await screen.findByTestId("records.detail_modal");
    expect(
      within(modal).getAllByText("Boutique Detail").length,
    ).toBeGreaterThan(0);
    expect(
      within(modal).getAllByText("Un produit detaille").length,
    ).toBeGreaterThan(0);
    expect(within(modal).getByText("7 500 FCFA")).toBeInTheDocument();
    expect(within(modal).getByText("750 FCFA")).toBeInTheDocument();
  });
});

describe("StartPage", () => {
  it("shows the VIP level, the 2x2 stats grid and starts a task", async () => {
    const actor = createMockActor({
      getDailyProgress: vi.fn().mockResolvedValue(
        makeProgress({
          vipLevel: VipLevelEnum.vip1,
          dailyTaskQuota: 5n,
          completedToday: 1n,
          availableBalance: 10_000n,
          commissionEarned: 500n,
          canStartTask: true,
        }),
      ),
      startTask: vi.fn().mockResolvedValue(makeRecord()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<StartPage />);

    expect(await screen.findByText("VIP1")).toBeInTheDocument();
    expect(screen.getByText("1/5")).toBeInTheDocument();
    expect(screen.getByText("10 000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("500 FCFA")).toBeInTheDocument();

    await user.click(screen.getByTestId("start.primary_button"));
    await user.click(
      await screen.findByTestId("start.confirm_dialog.confirm_button"),
    );
    await waitFor(() => {
      expect(actor.startTask).toHaveBeenCalled();
    });
    expect(
      await screen.findByTestId("start.success_state"),
    ).toBeInTheDocument();
  });

  it("disables the start button and shows a notice when the quota is reached", async () => {
    const actor = createMockActor({
      getDailyProgress: vi.fn().mockResolvedValue(
        makeProgress({
          canStartTask: false,
          completedToday: 3n,
          dailyTaskQuota: 3n,
        }),
      ),
    });
    setMockActor(actor);
    renderWithProviders(<StartPage />);

    expect(await screen.findByTestId("start.quota_notice")).toBeInTheDocument();
    expect(screen.getByTestId("start.primary_button")).toBeDisabled();
  });
});
