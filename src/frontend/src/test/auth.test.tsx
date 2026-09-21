import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { resetCoreMock, setMockActor } from "@/test/core-mock";
import {
  createMockActor,
  makeAccount,
  makeSession,
  renderWithProviders,
} from "@/test/harness";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@caffeineai/core-infrastructure", async () => {
  const { coreInfrastructureMock } = await import("@/test/core-mock");
  return coreInfrastructureMock();
});

// The pages navigate with TanStack Router; a local mock keeps the journey
// focused on the form contract rather than on router internals.
const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

beforeEach(() => {
  resetCoreMock();
  navigate.mockReset();
});

describe("LoginPage", () => {
  it("shows the sign-in form and a sign-up path when signed out", () => {
    setMockActor(createMockActor());
    renderWithProviders(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "Se connecter" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("login.phone_input")).toBeInTheDocument();
    expect(screen.getByTestId("login.password_input")).toBeInTheDocument();
    expect(screen.getByTestId("login.submit_button")).toBeInTheDocument();
    expect(screen.getByTestId("login.register_button")).toBeInTheDocument();
  });

  it("rejects an empty phone and password with visible errors", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByTestId("login.submit_button"));

    expect(
      await screen.findByText("Le numéro de téléphone est obligatoire."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Le mot de passe est obligatoire."),
    ).toBeInTheDocument();
    expect(actor.login).not.toHaveBeenCalled();
  });

  it("signs in with phone and password and navigates home", async () => {
    const actor = createMockActor({
      login: vi.fn().mockResolvedValue(makeSession()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByTestId("login.phone_input"), "+2250700000001");
    await user.type(screen.getByTestId("login.password_input"), "secret123");
    await user.click(screen.getByTestId("login.submit_button"));

    await waitFor(() => {
      expect(actor.login).toHaveBeenCalledWith("+2250700000001", "secret123");
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/" });
    });
  });

  it("surfaces a backend sign-in failure", async () => {
    const actor = createMockActor({
      login: vi
        .fn()
        .mockRejectedValue(new Error("Invalid phone number or password")),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByTestId("login.phone_input"), "+2250700000001");
    await user.type(screen.getByTestId("login.password_input"), "wrongpass");
    await user.click(screen.getByTestId("login.submit_button"));

    expect(
      await screen.findByText("Numéro de téléphone ou mot de passe incorrect."),
    ).toBeInTheDocument();
  });
});

describe("RegisterPage", () => {
  it("requires phone, password, promo code and secondary password", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.click(screen.getByTestId("register.submit_button"));

    expect(
      await screen.findByText("Le code promotionnel est obligatoire."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Le mot de passe de retrait est obligatoire."),
    ).toBeInTheDocument();
    expect(actor.register).not.toHaveBeenCalled();
  });

  it("rejects an empty promo code without calling the backend", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(
      screen.getByTestId("register.phone_input"),
      "+2250700000002",
    );
    await user.type(screen.getByTestId("register.password_input"), "secret123");
    await user.type(
      screen.getByTestId("register.secondary_input"),
      "withdraw1",
    );
    await user.click(screen.getByTestId("register.submit_button"));

    expect(
      await screen.findByText("Le code promotionnel est obligatoire."),
    ).toBeInTheDocument();
    expect(actor.register).not.toHaveBeenCalled();
  });

  it("registers with a valid promo code and lands at VIP0", async () => {
    const account = makeAccount({
      id: 7n,
      vipLevel: "vip0" as never,
      promoCode: "VIP7PROMO",
    });
    const actor = createMockActor({
      register: vi.fn().mockResolvedValue(account),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(
      screen.getByTestId("register.phone_input"),
      "+2250700000002",
    );
    await user.type(screen.getByTestId("register.password_input"), "secret123");
    await user.type(screen.getByTestId("register.promo_input"), "VIP1PROMO");
    await user.type(
      screen.getByTestId("register.secondary_input"),
      "withdraw1",
    );
    await user.click(screen.getByTestId("register.submit_button"));

    await waitFor(() => {
      expect(actor.register).toHaveBeenCalledWith(
        "+2250700000002",
        "secret123",
        "VIP1PROMO",
        "withdraw1",
      );
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/" });
    });
  });

  it("surfaces an invalid promo code rejection from the backend", async () => {
    const actor = createMockActor({
      register: vi.fn().mockRejectedValue(new Error("Invalid promo code")),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(
      screen.getByTestId("register.phone_input"),
      "+2250700000002",
    );
    await user.type(screen.getByTestId("register.password_input"), "secret123");
    await user.type(screen.getByTestId("register.promo_input"), "NOPE");
    await user.type(
      screen.getByTestId("register.secondary_input"),
      "withdraw1",
    );
    await user.click(screen.getByTestId("register.submit_button"));

    expect(await screen.findByText("Invalid promo code")).toBeInTheDocument();
  });
});

describe("AdminLoginPage", () => {
  it("signs the fixed admin in and routes to the console", async () => {
    const actor = createMockActor({
      adminLogin: vi.fn().mockResolvedValue(
        makeSession({
          isAdmin: true,
          account: makeAccount({ id: 0n, phone: "silas1234" }),
        }),
      ),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminLoginPage />);

    await user.type(
      screen.getByTestId("admin_login.username_input"),
      "silas1234",
    );
    await user.type(
      screen.getByTestId("admin_login.password_input"),
      "silas123456",
    );
    await user.click(screen.getByTestId("admin_login.submit_button"));

    await waitFor(() => {
      expect(actor.adminLogin).toHaveBeenCalledWith("silas1234", "silas123456");
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/admin" });
    });
  });

  it("requires a username before submitting", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminLoginPage />);

    await user.click(screen.getByTestId("admin_login.submit_button"));

    expect(
      await screen.findByText("Le nom d'utilisateur est obligatoire."),
    ).toBeInTheDocument();
    expect(actor.adminLogin).not.toHaveBeenCalled();
  });
});
