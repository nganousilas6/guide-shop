import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

/**
 * Warm tangerine gradient hero with the playful 3D e-commerce illustration.
 * The VIP level is the focal point, framed by a frosted glass badge.
 */
export function VipHero({
  vipLabel,
  className,
}: {
  vipLabel: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <section
      data-ocid="start.hero"
      className={cn(
        "relative isolate overflow-hidden bg-hero-gradient px-4 pb-6 pt-5",
        className,
      )}
    >
      {/* Soft light blooms for depth */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-12 size-40 rounded-full bg-card/30 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-6 size-32 rounded-full bg-primary/25 blur-2xl"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
        <span
          data-ocid="start.vip_badge"
          className="inline-flex items-center gap-1.5 rounded-full border border-card/40 bg-card/25 px-3.5 py-1.5 font-display text-sm font-bold tracking-wide text-accent-foreground shadow-xs backdrop-blur-sm"
        >
          <Crown className="size-4" aria-hidden />
          {vipLabel}
        </span>

        <img
          src="/assets/generated/start-hero-3d.dim_800x600.png"
          alt={t("home.heroAlt")}
          width={800}
          height={600}
          loading="eager"
          className="mt-1 h-40 w-auto max-w-full animate-float-soft object-contain drop-shadow-[0_14px_18px_rgba(120,60,0,0.22)] sm:h-48"
        />
      </div>
    </section>
  );
}
