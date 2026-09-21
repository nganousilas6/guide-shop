import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouterState: (options?: {
    select?: (state: { location: { pathname: string } }) => unknown;
  }) =>
    options?.select
      ? options.select({ location: { pathname: "/" } })
      : { location: { pathname: "/" } },
}));

function LanguageProbe() {
  const { language, t } = useTranslation();
  return (
    <div>
      <span data-ocid="language">{language}</span>
      <span data-ocid="label">{t("nav.home")}</span>
    </div>
  );
}

describe("i18n", () => {
  it("defaults to French and toggles to English", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Header title="Guide Shop" />
        <LanguageProbe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("language")).toHaveTextContent("fr");
    expect(screen.getByTestId("label")).toHaveTextContent("Accueil");

    await user.click(screen.getByTestId("nav.language_toggle"));

    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("label")).toHaveTextContent("Home");
  });

  it("persists the chosen language across a remount", async () => {
    const user = userEvent.setup();
    const first = render(
      <I18nProvider>
        <Header title="Guide Shop" />
        <LanguageProbe />
      </I18nProvider>,
    );

    await user.click(screen.getByTestId("nav.language_toggle"));
    expect(screen.getByTestId("language")).toHaveTextContent("en");
    first.unmount();

    render(
      <I18nProvider>
        <LanguageProbe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("label")).toHaveTextContent("Home");
  });
});

describe("BottomNav", () => {
  it("renders the five tabs with the active tab highlighted", () => {
    render(
      <I18nProvider>
        <BottomNav />
      </I18nProvider>,
    );

    expect(screen.getByTestId("nav.home_tab")).toBeInTheDocument();
    expect(screen.getByTestId("nav.records_tab")).toBeInTheDocument();
    expect(screen.getByTestId("nav.start_tab")).toBeInTheDocument();
    expect(screen.getByTestId("nav.service_tab")).toBeInTheDocument();
    expect(screen.getByTestId("nav.account_tab")).toBeInTheDocument();

    expect(screen.getByTestId("nav.home_tab")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByTestId("nav.records_tab")).not.toHaveAttribute(
      "aria-current",
    );
  });
});
