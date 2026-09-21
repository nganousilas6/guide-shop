import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { useTranslation } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

export function Layout({
  title,
  children,
  onBack,
  headerRight,
  showNav = true,
}: {
  title?: string;
  children: ReactNode;
  onBack?: () => void;
  headerRight?: ReactNode;
  showNav?: boolean;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header
        title={title ?? t("app.name")}
        onMenu={onBack ? undefined : () => setMenuOpen((open) => !open)}
        onBack={onBack}
        right={headerRight}
      />

      {menuOpen && !onBack ? (
        <div
          data-ocid="nav.menu_panel"
          className="border-b border-border bg-card px-4 py-3 shadow-card"
        >
          <ul className="mx-auto flex w-full max-w-md flex-wrap gap-2">
            {(
              [
                ["/", "nav.home"],
                ["/records", "nav.records"],
                ["/start", "nav.start"],
                ["/service", "nav.service"],
                ["/account", "nav.account"],
              ] as const
            ).map(([to, key]) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-smooth hover:bg-primary hover:text-primary-foreground"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <main className={showNav ? "flex-1 pb-20" : "flex-1"}>{children}</main>

      {showNav ? (
        <footer className="border-t border-border bg-muted/50 px-4 py-4 pb-24 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window === "undefined" ? "" : window.location.hostname,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {t("footer.builtWith")}
            </a>
          </p>
        </footer>
      ) : null}

      {showNav ? <BottomNav /> : null}
    </div>
  );
}
