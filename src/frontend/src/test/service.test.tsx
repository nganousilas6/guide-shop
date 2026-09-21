import { ServicePage } from "@/pages/ServicePage";
import { resetCoreMock, setIdentity, setMockActor } from "@/test/core-mock";
import {
  createMockActor,
  makeMessage,
  renderWithProviders,
  seedSession,
} from "@/test/harness";
import { screen, waitFor } from "@testing-library/react";
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
      ? options.select({ location: { pathname: "/service" } })
      : { location: { pathname: "/service" } },
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

describe("ServicePage", () => {
  it("shows an empty state when there are no messages", async () => {
    setMockActor(createMockActor());
    renderWithProviders(<ServicePage />);

    expect(await screen.findByText("Aucun message")).toBeInTheDocument();
  });

  it("renders the user's messages and the admin's replies", async () => {
    const actor = createMockActor({
      listMyMessages: vi.fn().mockResolvedValue([
        makeMessage({
          id: 2n,
          body: "Bonjour, j'ai une question",
          fromAdmin: false,
        }),
        makeMessage({
          id: 1n,
          body: "Bonjour, comment puis-je aider ?",
          fromAdmin: true,
        }),
      ]),
    });
    setMockActor(actor);
    renderWithProviders(<ServicePage />);

    expect(
      await screen.findByText("Bonjour, j'ai une question"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bonjour, comment puis-je aider ?"),
    ).toBeInTheDocument();
  });

  it("sends a typed message through the backend and clears the draft", async () => {
    const actor = createMockActor({
      sendMessage: vi
        .fn()
        .mockResolvedValue(makeMessage({ id: 3n, body: "Merci beaucoup" })),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<ServicePage />);

    const input = await screen.findByTestId("service.message_input");
    await user.type(input, "Merci beaucoup");
    await user.click(screen.getByTestId("service.send_button"));

    await waitFor(() => {
      expect(actor.sendMessage).toHaveBeenCalledWith("Merci beaucoup", null);
    });
    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("does not send an empty or whitespace-only message", async () => {
    const actor = createMockActor();
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<ServicePage />);

    const input = await screen.findByTestId("service.message_input");
    await user.type(input, "   ");
    await user.click(screen.getByTestId("service.send_button"));

    expect(actor.sendMessage).not.toHaveBeenCalled();
  });

  it("restores the draft when the send fails", async () => {
    const actor = createMockActor({
      sendMessage: vi.fn().mockRejectedValue(new Error("network down")),
    });
    setMockActor(actor);
    const user = userEvent.setup();
    renderWithProviders(<ServicePage />);

    const input = await screen.findByTestId("service.message_input");
    await user.type(input, "Message important");
    await user.click(screen.getByTestId("service.send_button"));

    await waitFor(() => {
      expect(input).toHaveValue("Message important");
    });
  });
});
