import { type TranslationKey, useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  Home,
  type LucideIcon,
  PlayCircle,
  User,
  Wrench,
} from "lucide-react";

type NavItem = {
  to: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  ocid: string;
};

const items: NavItem[] = [
  { to: "/", labelKey: "nav.home", icon: Home, ocid: "nav.home_tab" },
  {
    to: "/records",
    labelKey: "nav.records",
    icon: FileText,
    ocid: "nav.records_tab",
  },
  {
    to: "/start",
    labelKey: "nav.start",
    icon: PlayCircle,
    ocid: "nav.start_tab",
  },
  {
    to: "/service",
    labelKey: "nav.service",
    icon: Wrench,
    ocid: "nav.service_tab",
  },
  {
    to: "/account",
    labelKey: "nav.account",
    icon: User,
    ocid: "nav.account_tab",
  },
];

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav
      data-ocid="nav.bottom_bar"
      aria-label={t("nav.menu")}
      className="fixed inset-x-0 bottom-0 z-40 bg-secondary text-secondary-foreground shadow-chrome safe-bottom"
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch">
        {items.map((item) => {
          const isActive =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                data-ocid={item.ocid}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "text-primary"
                    : "text-secondary-foreground/70 hover:text-secondary-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    isActive && "drop-shadow-[0_0_6px_rgba(0,190,220,0.55)]",
                  )}
                  aria-hidden
                />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
