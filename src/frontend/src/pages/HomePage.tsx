import { type CarouselSlide, HomeCarousel } from "@/components/HomeCarousel";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageContainer,
  SectionHeading,
  SurfaceCard,
} from "@/components/ui-bits";
import { useCommissions } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { type TranslationKey, useTranslation } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { Coins, Sparkles } from "lucide-react";

const slides: CarouselSlide[] = [
  {
    src: "/assets/generated/product-tank-top.dim_800x800.jpg",
    alt: "White ribbed tank top with gray trim worn by a model",
    caption: "home.slideTankTop",
  },
  {
    src: "/assets/generated/product-polo-navy.dim_800x800.jpg",
    alt: "Navy blue polo shirt on a white studio background",
    caption: "home.slidePoloNavy",
  },
  {
    src: "/assets/generated/product-polo-maroon.dim_800x800.jpg",
    alt: "Maroon polo shirt on a white studio background",
    caption: "home.slidePoloMaroon",
  },
];

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const commissions = useCommissions(isAuthenticated);

  const entries = commissions.data ?? [];

  return (
    <PageContainer data-ocid="home.page">
      <section aria-label={t("home.materials")}>
        <SectionHeading>{t("home.materials")}</SectionHeading>
        <HomeCarousel
          slides={slides.map((slide) => ({
            ...slide,
            caption: t(slide.caption as TranslationKey),
          }))}
        />
      </section>

      <section aria-label={t("home.about")}>
        <SectionHeading>{t("home.about")}</SectionHeading>
        <SurfaceCard className="overflow-hidden p-0">
          <div className="flex items-stretch">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4">
              <p className="font-display text-lg font-bold leading-tight text-foreground">
                {t("app.name")}
              </p>
              <p className="text-sm leading-snug text-muted-foreground">
                {t("app.tagline")}
              </p>
              <Link
                to="/account"
                data-ocid="home.about_cta"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-smooth hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Sparkles className="size-4" aria-hidden />
                {t("home.aboutCta")}
              </Link>
            </div>
            <div
              aria-hidden
              className="relative w-28 shrink-0 bg-hero-gradient sm:w-36"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_60%)]" />
              <div className="absolute inset-y-0 left-0 w-6 -skew-x-6 bg-card" />
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section aria-label={t("home.commission")}>
        <SectionHeading>{t("home.commission")}</SectionHeading>

        {commissions.isLoading ? (
          <ListSkeleton rows={2} />
        ) : commissions.isError ? (
          <ErrorState
            message={t("common.error")}
            retryLabel={t("common.retry")}
            onRetry={() => void commissions.refetch()}
          />
        ) : entries.length === 0 ? (
          <EmptyState
            title={t("home.commissionEmpty")}
            hint={t("home.commissionEmptyHint")}
            icon={<Coins className="size-5" aria-hidden />}
            action={
              <Link
                to="/start"
                data-ocid="home.commission_cta"
                className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t("home.earnCommission")}
              </Link>
            }
          />
        ) : (
          <ul data-ocid="home.commission_list" className="space-y-2.5">
            {entries.map((entry, index) => (
              <li
                key={entry.id.toString()}
                data-ocid={`home.commission_item.${index + 1}`}
                className="flex items-center justify-between gap-3 rounded-full border border-border bg-card px-4 py-3 shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-foreground">
                    {entry.source || t("home.earnCommission")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 font-display text-sm font-bold text-destructive">
                  +{formatFcfa(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
