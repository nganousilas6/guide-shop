import { AttachmentKind, ExternalBlob } from "@/backend";
import { AccountPage } from "@/pages/AccountPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ServicePage } from "@/pages/ServicePage";
import { StartPage } from "@/pages/StartPage";
import { resetCoreMock, setIdentity, setMockActor } from "@/test/core-mock";
import {
  createMockActor,
  makeAccount,
  makeAdminRow,
  makeConversation,
  makeMessage,
  makeProgress,
  makeSession,
  renderWithProviders,
  seedSession,
} from "@/test/harness";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover tests for the accepted Guide Shop requirements: password minimums,
 * the insufficient-balance gate, recharge request/credit, account blocking,
 * the 2 000 FCFA withdrawal minimum, the service open/closed window and chat
 * attachments.
 *
 * These are component/integration tests against a typed local actor mock.
 * They prove the frontend's consumer contract and UI behavior, never the real
 * canister or object-storage gateway.
 */

vi.mock("@caffeineai/core-infrastructure", async () => {
  const { coreInfrastructureMock } = await import("@/test/core-mock");
  return coreInfrastructureMock();
});

// The attachment flow uploads through platform object storage. Replace the
// gateway with an in-memory blob so no network call is made and the returned
// `Attachment` is deterministic.
vi.mock("@caffeineai/object-storage", () => {
  class FakeExternalBlob {
    directURL: string;
    constructor(
      private readonly bytes: Uint8Array,
      private readonly contentType: string,
      filename: string,
    ) {
      this.directURL = `https://storage.test/${filename}`;
    }
    static fromBytes(bytes: Uint8Array, contentType: string, filename: string) {
      return new FakeExternalBlob(bytes, contentType, filename);
    }
    static fromURL(url: string) {
      const blob = new FakeExternalBlob(new Uint8Array(), "", "");
      blob.directURL = url;
      return blob;
    }
    withUploadProgress(onProgress: (percent: number) => void) {
      onProgress(100);
      return this;
    }
    getDirectURL() {
      return this.directURL;
    }
    getBytes() {
      return this.bytes;
    }
    getContentType() {
      return this.contentType;
    }
  }
  return { ExternalBlob: FakeExternalBlob };
});

// jsdom's Blob/File may not implement arrayBuffer(); the upload path reads the
// file bytes before handing them to object storage.
if (typeof Blob !== "undefined" && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  };
}

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
/* 8-character password minimum                                        */
/* ------------------------------------------------------------------ */

describe("password minimum length", () => {
  it("rejects a registration password shorter than 8 characters", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(
      screen.getByTestId("register.phone_input"),
      "+2250700000001",
    );
    await user.type(screen.getByTestId("register.password_input"), "short7");
    await user.type(screen.getByTestId("register.promo_input"), "VIP1PROMO");
    await user.type(
      screen.getByTestId("register.secondary_input"),
      "withdraw1",
    );
    await user.click(screen.getByTestId("register.submit_button"));

    expect(
      await screen.findByText(
        "Le mot de passe doit contenir au moins 8 caractères.",
      ),
    ).toBeInTheDocument();
    expect(actor.register).not.toHaveBeenCalled();
  });

  it("rejects a secondary password shorter than 8 characters", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(
      screen.getByTestId("register.phone_input"),
      "+2250700000001",
    );
    await user.type(screen.getByTestId("register.password_input"), "secret123");
    await user.type(screen.getByTestId("register.promo_input"), "VIP1PROMO");
    await user.type(screen.getByTestId("register.secondary_input"), "short7");
    await user.click(screen.getByTestId("register.submit_button"));

    expect(
      await screen.findByText(
        "Le mot de passe de retrait doit contenir au moins 8 caractères.",
      ),
    ).toBeInTheDocument();
    expect(actor.register).not.toHaveBeenCalled();
  });

  it("registers once both passwords reach 8 characters", async () => {
    const actor = createMockActor({
      register: vi.fn().mockResolvedValue(makeAccount()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(
      screen.getByTestId("register.phone_input"),
      "+2250700000001",
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
        "+2250700000001",
        "secret123",
        "VIP1PROMO",
        "withdraw1",
      );
    });
  });

  it("refuses an admin secondary-password change shorter than 8 characters", async () => {
    const actor = createMockActor({
      listAccounts: vi
        .fn()
        .mockResolvedValue([makeAdminRow({ id: 7n, phone: "+2250700000007" })]),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(
      await screen.findByTestId("admin.set_secondary_password_button.1"),
    );
    const dialog = await screen.findByTestId("admin.secondary_password_dialog");
    await user.type(
      within(dialog).getByTestId("admin.secondary_password_input"),
      "short7",
    );
    await user.click(
      within(dialog).getByTestId("admin.secondary_password_confirm_button"),
    );

    expect(
      await screen.findByText(
        "Le mot de passe de retrait doit contenir au moins 8 caractères.",
      ),
    ).toBeInTheDocument();
    expect(actor.setSecondaryPassword).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* Admin login with the fixed credentials                              */
/* ------------------------------------------------------------------ */

describe("admin login", () => {
  it("signs in with silas1234 / silas123456 and reaches the console", async () => {
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
});

/* ------------------------------------------------------------------ */
/* Insufficient-balance gate                                           */
/* ------------------------------------------------------------------ */

describe("insufficient-balance gate", () => {
  it("disables the start CTA and shows the recharge notice", async () => {
    const actor = createMockActor({
      getDailyProgress: vi.fn().mockResolvedValue(
        makeProgress({
          insufficientBalance: true,
          canStartTask: true,
          availableBalance: 0n,
        }),
      ),
    });
    setMockActor(actor);
    renderWithProviders(<StartPage />);

    expect(
      await screen.findByTestId("start.insufficient_notice"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Solde insuffisant, contactez le service via le formulaire pour continuer.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("start.primary_button")).toBeDisabled();
  });

  it("shows the requested recharge card with the amount and a service link", async () => {
    const actor = createMockActor({
      getDailyProgress: vi.fn().mockResolvedValue(
        makeProgress({
          insufficientBalance: true,
          requestedRecharge: 25_000n,
        }),
      ),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<StartPage />);

    const card = await screen.findByTestId("start.recharge_card");
    expect(within(card).getByText("Recharge demandée")).toBeInTheDocument();
    expect(within(card).getByText("25 000 FCFA")).toBeInTheDocument();

    await user.click(within(card).getByTestId("start.recharge_service_button"));
    expect(navigate).toHaveBeenCalledWith({ to: "/service" });
  });
});

/* ------------------------------------------------------------------ */
/* Recharge request / credit (admin)                                   */
/* ------------------------------------------------------------------ */

describe("admin recharge flow", () => {
  it("saves a requested recharge amount for an account", async () => {
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

  it("prefills the requested recharge amount when one is already set", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          requestedRecharge: 15_000n,
        }),
      ]),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(
      await screen.findByTestId("admin.recharge_request_button.1"),
    );
    const dialog = await screen.findByTestId("admin.amount_dialog");
    expect(within(dialog).getByTestId("admin.amount_input")).toHaveValue(
      "15000",
    );
  });

  it("credits a recharge, increasing the account balance", async () => {
    const actor = createMockActor({
      listAccounts: vi
        .fn()
        .mockResolvedValue([makeAdminRow({ id: 7n, phone: "+2250700000007" })]),
      creditRecharge: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
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

  it("grants a commission to an account", async () => {
    const actor = createMockActor({
      listAccounts: vi
        .fn()
        .mockResolvedValue([makeAdminRow({ id: 7n, phone: "+2250700000007" })]),
      grantCommission: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(
      await screen.findByTestId("admin.grant_commission_button.1"),
    );
    const dialog = await screen.findByTestId("admin.amount_dialog");
    await user.type(within(dialog).getByTestId("admin.amount_input"), "5000");
    await user.click(within(dialog).getByTestId("admin.amount_confirm_button"));

    await waitFor(() => {
      expect(actor.grantCommission).toHaveBeenCalledWith(7n, 5_000n);
    });
  });

  it("sets the promised pending refund for an account", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          pendingRefund: 5_000n,
        }),
      ]),
      setPendingRefund: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(
      await screen.findByTestId("admin.pending_refund_button.1"),
    );
    const dialog = await screen.findByTestId("admin.amount_dialog");
    await user.type(within(dialog).getByTestId("admin.amount_input"), "5000");
    await user.click(within(dialog).getByTestId("admin.amount_confirm_button"));

    await waitFor(() => {
      expect(actor.setPendingRefund).toHaveBeenCalledWith(7n, 5_000n);
    });
  });
});

/* ------------------------------------------------------------------ */
/* Account blocking                                                    */
/* ------------------------------------------------------------------ */

describe("account blocking", () => {
  it("blocks an account after confirmation", async () => {
    const actor = createMockActor({
      listAccounts: vi
        .fn()
        .mockResolvedValue([makeAdminRow({ id: 7n, phone: "+2250700000007" })]),
      setAccountBlocked: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.block_button.1"));
    const dialog = await screen.findByTestId("admin.block_dialog");
    expect(within(dialog).getByText("Bloquer ce compte ?")).toBeInTheDocument();
    await user.click(
      within(dialog).getByTestId("admin.block_dialog.confirm_button"),
    );

    await waitFor(() => {
      expect(actor.setAccountBlocked).toHaveBeenCalledWith(7n, true);
    });
  });

  it("unblocks an already-blocked account", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          blocked: true,
        }),
      ]),
      setAccountBlocked: vi.fn().mockResolvedValue(makeAdminRow({ id: 7n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    expect(await screen.findByText("Bloqué")).toBeInTheDocument();
    await user.click(await screen.findByTestId("admin.block_button.1"));
    const dialog = await screen.findByTestId("admin.block_dialog");
    expect(
      within(dialog).getByText("Débloquer ce compte ?"),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByTestId("admin.block_dialog.confirm_button"),
    );

    await waitFor(() => {
      expect(actor.setAccountBlocked).toHaveBeenCalledWith(7n, false);
    });
  });

  it("shows the blocked notice and disables the start CTA for a blocked user", async () => {
    const actor = createMockActor({
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(makeProgress({ blocked: true, canStartTask: true })),
    });
    setMockActor(actor);
    renderWithProviders(<StartPage />);

    expect(
      await screen.findByTestId("start.blocked_notice"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Votre compte est bloqué. Contactez le service client pour le débloquer.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("start.primary_button")).toBeDisabled();
  });

  it("locks the withdrawal dialog with the blocked reason", async () => {
    const actor = createMockActor({
      getMyAccount: vi
        .fn()
        .mockResolvedValue(makeAccount({ balance: 5_000n, blocked: true })),
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(
          makeProgress({ canStartTask: false, completedToday: 3n }),
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
        "Votre compte est bloqué. Contactez le service client pour le débloquer.",
      ),
    ).toBeInTheDocument();
    expect(actor.requestWithdrawal).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* 2 000 FCFA withdrawal minimum                                       */
/* ------------------------------------------------------------------ */

describe("withdrawal minimum", () => {
  it("rejects an amount below 2 000 FCFA without calling the backend", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(
          makeProgress({ canStartTask: false, completedToday: 3n }),
        ),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(
      await screen.findByTestId("account.withdraw.open_modal_button"),
    );
    await user.type(
      await screen.findByTestId("account.withdraw.amount_input"),
      "1500",
    );
    await user.type(
      screen.getByTestId("account.withdraw.secondary_input"),
      "withdraw1",
    );
    await user.click(screen.getByTestId("account.withdraw.submit_button"));

    expect(
      await screen.findByText(
        "Le montant minimum de retrait est de 2 000 FCFA.",
      ),
    ).toBeInTheDocument();
    expect(actor.requestWithdrawal).not.toHaveBeenCalled();
  });

  it("accepts exactly 2 000 FCFA", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(
          makeProgress({ canStartTask: false, completedToday: 3n }),
        ),
      requestWithdrawal: vi.fn().mockResolvedValue(undefined),
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

    await waitFor(() => {
      expect(actor.requestWithdrawal).toHaveBeenCalledWith(2_000n, "withdraw1");
    });
  });

  it("maps the backend minimum trap to the same message", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi
        .fn()
        .mockResolvedValue(
          makeProgress({ canStartTask: false, completedToday: 3n }),
        ),
      requestWithdrawal: vi
        .fn()
        .mockRejectedValue(
          new Error("Le montant minimum de retrait est de 2000 FCFA"),
        ),
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
        "Le montant minimum de retrait est de 2 000 FCFA.",
      ),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Service open / closed window                                        */
/* ------------------------------------------------------------------ */

describe("service open/closed window", () => {
  it("allows sending while the service is open", async () => {
    const actor = createMockActor({
      getServiceStatus: vi.fn().mockResolvedValue({
        isOpen: true,
        opensAtHour: 8n,
        closesAtHour: 18n,
      }),
      sendMessage: vi
        .fn()
        .mockResolvedValue(makeMessage({ id: 3n, body: "Bonjour" })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<ServicePage />);

    expect(await screen.findByText("Service ouvert")).toBeInTheDocument();
    const input = await screen.findByTestId("service.message_input");
    expect(input).toBeEnabled();
    await user.type(input, "Bonjour");
    await user.click(screen.getByTestId("service.send_button"));

    await waitFor(() => {
      expect(actor.sendMessage).toHaveBeenCalledWith("Bonjour", null);
    });
  });

  it("disables the composer and shows the closed banner outside hours", async () => {
    const actor = createMockActor({
      getServiceStatus: vi.fn().mockResolvedValue({
        isOpen: false,
        opensAtHour: 8n,
        closesAtHour: 18n,
      }),
    });
    setMockActor(actor);
    renderWithProviders(<ServicePage />);

    expect(await screen.findByText("Service fermé")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Le service est fermé de 18h00 à 08h00. Il rouvre à 08h00.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("service.message_input")).toBeDisabled();
    expect(screen.getByTestId("service.send_button")).toBeDisabled();
    expect(screen.getByTestId("service.attach_button")).toBeDisabled();
  });
});

/* ------------------------------------------------------------------ */
/* Chat attachments                                                    */
/* ------------------------------------------------------------------ */

describe("chat attachments", () => {
  it("uploads a picked file and sends it with the message", async () => {
    const actor = createMockActor({
      sendMessage: vi.fn().mockResolvedValue(makeMessage({ id: 4n })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<ServicePage />);

    const file = new File(["hello"], "recu.png", { type: "image/png" });
    // The input is visually hidden, so drive its change event directly.
    fireEvent.change(await screen.findByTestId("service.upload_button"), {
      target: { files: [file] },
    });

    // The chip shows the picked file before sending.
    expect(await screen.findByText("recu.png")).toBeInTheDocument();

    await user.type(
      screen.getByTestId("service.message_input"),
      "Voici le reçu",
    );
    await user.click(screen.getByTestId("service.send_button"));

    await waitFor(() => {
      expect(actor.sendMessage).toHaveBeenCalledTimes(1);
    });
    const [body, attachment] = actor.sendMessage.mock.calls[0];
    expect(body).toBe("Voici le reçu");
    expect(attachment).not.toBeNull();
    expect(attachment.name).toBe("recu.png");
    expect(attachment.kind).toBe(AttachmentKind.image);
    expect(attachment.size).toBe(5n);
  });

  it("rejects a file larger than 25 MB with a clear error", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<ServicePage />);

    const big = new File(["x"], "huge.bin", {
      type: "application/octet-stream",
    });
    Object.defineProperty(big, "size", { value: 26 * 1024 * 1024 });
    fireEvent.change(await screen.findByTestId("service.upload_button"), {
      target: { files: [big] },
    });
    expect(await screen.findByText("huge.bin")).toBeInTheDocument();

    // The size guard runs during upload, i.e. on submit.
    await user.click(screen.getByTestId("service.send_button"));

    expect(
      await screen.findByText("Le fichier est trop volumineux (25 Mo max)."),
    ).toBeInTheDocument();
    expect(actor.sendMessage).not.toHaveBeenCalled();
  });

  it("renders an attachment on a received message", async () => {
    const actor = createMockActor({
      listMyMessages: vi.fn().mockResolvedValue([
        makeMessage({
          id: 1n,
          body: "Votre reçu",
          fromAdmin: true,
          attachment: {
            blob: ExternalBlob.fromURL("https://storage.test/recu.png"),
            kind: AttachmentKind.image,
            name: "recu.png",
            size: 5n,
          },
        }),
      ]),
    });
    setMockActor(actor);
    renderWithProviders(<ServicePage />);

    expect(await screen.findByText("Votre reçu")).toBeInTheDocument();
    expect(
      screen.getByTestId("service.message.1.attachment"),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Admin-only password visibility                                      */
/* ------------------------------------------------------------------ */

describe("admin password visibility", () => {
  it("reveals an account password from the admin console", async () => {
    const actor = createMockActor({
      listAccounts: vi.fn().mockResolvedValue([
        makeAdminRow({
          id: 7n,
          phone: "+2250700000007",
          password: "secret123",
          secondaryPassword: "withdraw1",
        }),
      ]),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    const passwordCell = await screen.findByTestId("admin.password.1");
    // Masked until the admin explicitly reveals it.
    expect(passwordCell).toHaveTextContent("••••••••");
    expect(passwordCell).not.toHaveTextContent("secret123");

    await user.click(screen.getByTestId("admin.password_toggle.1"));
    expect(passwordCell).toHaveTextContent("secret123");
  });

  it("never renders a password on the non-admin account page", async () => {
    const actor = createMockActor({
      getMyAccount: vi.fn().mockResolvedValue(makeAccount({ balance: 5_000n })),
      getDailyProgress: vi.fn().mockResolvedValue(makeProgress()),
    });
    setMockActor(actor);
    renderWithProviders(<AccountPage />);

    // The account page has no credential surface at all.
    expect(
      await screen.findByTestId("account.balance.card"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("admin.password.1")).not.toBeInTheDocument();
    expect(screen.queryByText("secret123")).not.toBeInTheDocument();
    expect(screen.queryByText("withdraw1")).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Admin clears a chat thread                                          */
/* ------------------------------------------------------------------ */

describe("admin clear chat", () => {
  it("clears a conversation after confirmation", async () => {
    const actor = createMockActor({
      listConversations: vi.fn().mockResolvedValue([
        makeConversation({
          userId: 5n,
          phone: "+2250700000005",
          lastMessage: "Bonjour",
        }),
      ]),
      clearConversation: vi.fn().mockResolvedValue(undefined),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    await user.click(await screen.findByTestId("admin.tab.inbox"));
    await user.click(await screen.findByTestId("admin.clear_chat_button.1"));

    const dialog = await screen.findByTestId("admin.clear_chat_dialog");
    expect(
      within(dialog).getByText("Supprimer cette conversation ?"),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByTestId("admin.clear_chat_dialog.confirm_button"),
    );

    await waitFor(() => {
      expect(actor.clearConversation).toHaveBeenCalledWith(5n);
    });
  });
});

/* ------------------------------------------------------------------ */
/* Recharge credit unlocks the start CTA                               */
/* ------------------------------------------------------------------ */

describe("recharge credit journey", () => {
  it("shows the credited balance and lets the user start a task", async () => {
    // The admin credits 25 000 FCFA; the user's progress then reports a
    // positive available balance and no insufficient-balance gate.
    const actor = createMockActor({
      getDailyProgress: vi.fn().mockResolvedValue(
        makeProgress({
          insufficientBalance: false,
          availableBalance: 25_000n,
          canStartTask: true,
        }),
      ),
      startTask: vi.fn().mockResolvedValue(makeProgress()),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<StartPage />);

    // "Solde disponible" reflects the credited amount.
    expect(await screen.findByText("25 000 FCFA")).toBeInTheDocument();
    expect(
      screen.queryByTestId("start.insufficient_notice"),
    ).not.toBeInTheDocument();

    const cta = screen.getByTestId("start.primary_button");
    expect(cta).toBeEnabled();
    await user.click(cta);
    await user.click(
      await screen.findByTestId("start.confirm_dialog.confirm_button"),
    );

    await waitFor(() => {
      expect(actor.startTask).toHaveBeenCalled();
    });
  });

  it("shows Solde disponible and the pending refund, both reflecting admin credits", async () => {
    // The admin credited 25 000 FCFA and promised a 5 000 FCFA refund; the
    // Demarrage zone must surface both figures with their French labels.
    const actor = createMockActor({
      getDailyProgress: vi.fn().mockResolvedValue(
        makeProgress({
          insufficientBalance: false,
          availableBalance: 25_000n,
          pendingRefund: 5_000n,
          canStartTask: true,
        }),
      ),
    });
    setMockActor(actor);
    renderWithProviders(<StartPage />);

    expect(await screen.findByText("Solde disponible")).toBeInTheDocument();
    expect(
      screen.getByText("Montant de remboursement en attente"),
    ).toBeInTheDocument();
    expect(screen.getByText("25 000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("5 000 FCFA")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Default route renders a usable screen                               */
/* ------------------------------------------------------------------ */

describe("default route", () => {
  it("renders the home page without a blank screen", async () => {
    const actor = createMockActor({
      listCommissions: vi.fn().mockResolvedValue([]),
    });
    setMockActor(actor);
    renderWithProviders(<HomePage />);

    expect(await screen.findByTestId("home.page")).toBeInTheDocument();
    expect(screen.getByText("Guide Shop")).toBeInTheDocument();
  });
});
