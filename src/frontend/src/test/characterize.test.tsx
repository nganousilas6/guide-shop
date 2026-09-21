import { AccountPage } from "@/pages/AccountPage";
import { AdminPage } from "@/pages/AdminPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ServicePage } from "@/pages/ServicePage";
import { resetCoreMock, setIdentity, setMockActor } from "@/test/core-mock";
import {
  VipLevelEnum,
  createMockActor,
  makeAccount,
  makeAdminRow,
  makeMessage,
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

/* ------------------------------------------------------------------ */
/* Login / Register form affordances                                   */
/* ------------------------------------------------------------------ */

describe("LoginPage affordances", () => {
  it("toggles password visibility and reveals the forgot-password hint", async () => {
    setMockActor(createMockActor());
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const password = screen.getByTestId("login.password_input");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByTestId("login.password_toggle"));
    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByTestId("login.forgot_button"));
    expect(
      screen.getByText(
        "Contactez le service client depuis l'onglet Service pour réinitialiser votre mot de passe.",
      ),
    ).toBeInTheDocument();
  });

  it("rejects a phone number that is too short without calling the backend", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByTestId("login.phone_input"), "123");
    await user.type(screen.getByTestId("login.password_input"), "secret123");
    await user.click(screen.getByTestId("login.submit_button"));

    expect(
      await screen.findByText("Entrez un numéro de téléphone valide."),
    ).toBeInTheDocument();
    expect(actor.login).not.toHaveBeenCalled();
  });

  it("routes to the register page from the sign-up button", async () => {
    setMockActor(createMockActor());
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByTestId("login.register_button"));

    expect(navigate).toHaveBeenCalledWith({ to: "/register" });
  });
});

describe("RegisterPage affordances", () => {
  it("toggles password visibility and uppercases the promo code", async () => {
    setMockActor(createMockActor());
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const password = screen.getByTestId("register.password_input");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByTestId("register.password_toggle"));
    expect(password).toHaveAttribute("type", "text");

    const promo = screen.getByTestId("register.promo_input");
    await user.type(promo, "vip1promo");
    expect(promo).toHaveValue("VIP1PROMO");
  });

  it("shows the secondary-password hint and routes back to login", async () => {
    setMockActor(createMockActor());
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    expect(
      screen.getByText(
        /Ce mot de passe confirme chaque demande de retrait\. Conservez-le précieusement\./,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("register.login_link"));
    expect(navigate).toHaveBeenCalledWith({ to: "/login" });
  });
});

/* ------------------------------------------------------------------ */
/* Admin console: tab navigation and task assignment                   */
/* ------------------------------------------------------------------ */

describe("AdminPage navigation and tasks", () => {
  it("switches between the five console tabs", async () => {
    setMockActor(createMockActor());
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    expect(
      await screen.findByTestId("admin.accounts_panel"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("admin.tab.tasks"));
    expect(await screen.findByTestId("admin.tasks_panel")).toBeInTheDocument();

    await user.click(screen.getByTestId("admin.tab.vip"));
    expect(await screen.findByTestId("admin.vip_panel")).toBeInTheDocument();

    await user.click(screen.getByTestId("admin.tab.withdrawals"));
    expect(
      await screen.findByTestId("admin.withdrawals_panel"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("admin.tab.inbox"));
    expect(await screen.findByTestId("admin.inbox_panel")).toBeInTheDocument();
  });

  it("assigns a task to a specific account", async () => {
    const actor = createMockActor({
      listAccounts: vi
        .fn()
        .mockResolvedValue([makeAdminRow({ id: 7n, phone: "+2250700000007" })]),
      assignTaskToUser: vi.fn().mockResolvedValue(makeRecord()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.tasks"));
    await user.selectOptions(
      await screen.findByTestId("admin.task_user_select"),
      "7",
    );
    await user.type(
      screen.getByTestId("admin.task_merchant_input"),
      "Marchand Test",
    );
    await user.type(
      screen.getByTestId("admin.task_product_input"),
      "Produit Test",
    );
    await user.type(
      screen.getByTestId("admin.task_thumbnail_input"),
      "https://example.test/thumb.png",
    );
    await user.type(screen.getByTestId("admin.task_value_input"), "5000");
    await user.click(screen.getByTestId("admin.assign_task_button"));

    await waitFor(() => {
      expect(actor.assignTaskToUser).toHaveBeenCalledWith(
        7n,
        "Marchand Test",
        "Produit Test",
        "https://example.test/thumb.png",
        5_000n,
      );
    });
    expect(await screen.findByTestId("success_state")).toBeInTheDocument();
  });

  it("assigns a task to a whole VIP level", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([]),
      assignTaskToVip: vi.fn().mockResolvedValue(makeRecord()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.tasks"));
    await user.click(await screen.findByTestId("admin.task_target.vip"));
    await user.selectOptions(
      await screen.findByTestId("admin.task_vip_select"),
      "vip2",
    );
    await user.type(
      screen.getByTestId("admin.task_merchant_input"),
      "Marchand VIP",
    );
    await user.type(
      screen.getByTestId("admin.task_product_input"),
      "Produit VIP",
    );
    await user.type(
      screen.getByTestId("admin.task_thumbnail_input"),
      "https://example.test/vip.png",
    );
    await user.type(screen.getByTestId("admin.task_value_input"), "9000");
    await user.click(screen.getByTestId("admin.assign_task_button"));

    await waitFor(() => {
      expect(actor.assignTaskToVip).toHaveBeenCalledWith(
        VipLevelEnum.vip2,
        "Marchand VIP",
        "Produit VIP",
        "https://example.test/vip.png",
        9_000n,
      );
    });
  });

  it("refuses to assign a task with missing fields", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([]),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.tasks"));
    await user.click(await screen.findByTestId("admin.assign_task_button"));

    expect(
      await screen.findByText("Tous les champs sont obligatoires."),
    ).toBeInTheDocument();
    expect(actor.assignTaskToUser).not.toHaveBeenCalled();
    expect(actor.assignTaskToVip).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* Account page: informational panels, password change, logout         */
/* ------------------------------------------------------------------ */

describe("AccountPage panels", () => {
  it("opens the informational panels from the services grid", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount()),
      getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(await screen.findByRole("button", { name: "Règle" }));
    const dialog = await screen.findByTestId("account.panel.dialog");
    expect(
      within(dialog).getByText(
        "Les tâches quotidiennes doivent être terminées avant toute demande de retrait. L'administrateur valide chaque retrait et crédite les soldes manuellement.",
      ),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByTestId("account.panel.start_button"));
    expect(navigate).toHaveBeenCalledWith({ to: "/start" });
  });

  it("shows the admin-only notice for the withdrawal password panel", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount()),
      getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(
      await screen.findByRole("button", { name: "Mot de passe" }),
    );

    expect(
      await screen.findByTestId("account.password.admin_only_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Le mot de passe de retrait est géré uniquement par le Service. Contactez le service client depuis l'onglet Service pour le modifier.",
      ),
    ).toBeInTheDocument();
    expect(actor.changeSecondaryPassword).not.toHaveBeenCalled();
  });

  it("logs out and returns to the login route", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount()),
      getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(await screen.findByRole("button", { name: "Sortie" }));

    expect(navigate).toHaveBeenCalledWith({ to: "/login", replace: true });
  });
});

/* ------------------------------------------------------------------ */
/* Service page: pagination and length guard                           */
/* ------------------------------------------------------------------ */

describe("ServicePage pagination and limits", () => {
  it("loads older messages through the backend and prepends them", async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      makeMessage({
        id: BigInt(100 - index),
        body: `Message ${100 - index}`,
        fromAdmin: false,
      }),
    );
    const actor = createMockActor({
      listMyMessages: vi
        .fn()
        .mockImplementation((_limit: bigint, before: bigint | null) => {
          if (before === null) return Promise.resolve(firstPage);
          return Promise.resolve([
            makeMessage({ id: 1n, body: "Message ancien", fromAdmin: false }),
          ]);
        }),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<ServicePage />);

    const loadMore = await screen.findByTestId("service.load_more_button");
    await user.click(loadMore);

    await waitFor(() => {
      expect(actor.listMyMessages).toHaveBeenCalledWith(50n, 51n);
    });
    expect(await screen.findByText("Message ancien")).toBeInTheDocument();
  });

  it("shows the character counter and blocks an over-long message", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<ServicePage />);

    const input = await screen.findByTestId("service.message_input");
    await user.type(input, "Bonjour");
    expect(screen.getByTestId("service.char_counter")).toHaveTextContent(
      "7/5000",
    );

    // The textarea caps at MAX_LENGTH + 1, so paste a single over-long value.
    await user.clear(input);
    await user.click(input);
    await user.paste("x".repeat(5001));

    expect(
      await screen.findByText(
        "Le message ne peut pas dépasser 5000 caractères.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("service.send_button")).toBeDisabled();
    expect(actor.sendMessage).not.toHaveBeenCalled();
  });
});
