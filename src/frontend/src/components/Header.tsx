import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Globe, Menu } from "lucide-react";
import type { ReactNode } from "react";

export function Header({
  title,
  onMenu,
  onBack,
  right,
  className,
}: {
  title: string;
  onMenu?: () => void;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
}) {
  const { language, toggleLanguage, t } = useTranslation();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-secondary text-secondary-foreground shadow-chrome",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-md items-center gap-2 px-3">
        {onBack ? (
          <button
            type="button"
            data-ocid="nav.back_button"
            onClick={onBack}
            aria-label={t("nav.back")}
            className="flex size-10 items-center justify-center rounded-full transition-smooth hover:bg-secondary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label={t("nav.back")}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : onMenu ? (
          <button
            type="button"
            data-ocid="nav.menu_button"
            onClick={onMenu}
            aria-label={t("nav.menu")}
            className="flex size-10 items-center justify-center rounded-full transition-smooth hover:bg-secondary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        ) : (
          <span className="size-10" aria-hidden />
        )}

        <h1 className="min-w-0 flex-1 truncate text-center font-display text-base font-bold tracking-tight">
          {title}
        </h1>

        <div className="flex items-center gap-1">
          {right}
          <button
            type="button"
            data-ocid="nav.language_toggle"
            onClick={toggleLanguage}
            aria-label={t("nav.language")}
            className="flex size-10 items-center justify-center rounded-full transition-smooth hover:bg-secondary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Globe className="size-5" aria-hidden />
            <span className="sr-only">{language.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
