import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type ServiceItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: "default" | "danger";
};

/**
 * Grid of black rounded-square service tiles with white glyphs, matching the
 * reference "Prestations de service" panel.
 */
export function ServiceGrid({ items }: { items: ServiceItem[] }) {
  return (
    <ul
      data-ocid="account.services.grid"
      className="grid grid-cols-4 gap-x-2 gap-y-5"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="flex flex-col items-center gap-2">
            <button
              type="button"
              data-ocid={`account.service.${item.id}`}
              onClick={item.onSelect}
              aria-label={item.label}
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl shadow-card transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95",
                item.tone === "danger"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/85",
              )}
            >
              <Icon className="size-6" aria-hidden />
            </button>
            <span className="text-center text-[11px] font-medium leading-tight text-foreground">
              {item.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
