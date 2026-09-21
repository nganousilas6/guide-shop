import { VipLevel } from "@/backend";
import { Layout } from "@/components/Layout";
import { VipHero } from "@/components/VipHero";
import {
  ConfirmDialog,
  ErrorState,
  ListSkeleton,
  PageContainer,
  PrimaryCta,
  SectionHeading,
  type StatCell,
  StatGrid,
  SurfaceCard,
} from "@/components/ui-bits";
import { useDailyProgress, useStartTask } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCount, formatFcfa, vipLabel } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import {
  Ban,
  CheckCircle2,
  MessageCircle,
  Play,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export function StartPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const progressQuery = useDailyProgress(isAuthenticated);
  const startTask = useStartTask();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const progress = progressQuery.data ?? null;
  const quotaReached = progress ? !progress.canStartTask : false;
  const blocked = progress?.blocked ?? false;
  const insufficientBalance = progress?.insufficientBalance ?? false;
  const gated = blocked || insufficientBalance;
  const requestedRecharge =
    progress?.requestedRecharge !== undefined && progress.requestedRecharge > 0n
      ? progress.requestedRecharge
      : null;
  const busy = startTask.isPending;

  const handleConfirm = () => {
    setJustCompleted(false);
    startTask.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        setJustCompleted(true);
      },
    });
  };

  const stats: StatCell[] = progress
    ? [
        {
          label: t("start.completedTasks"),
          value: `${formatCount(progress.completedToday)}/${formatCount(
            progress.dailyTaskQuota,
          )}`,
        },
        {
          label: t("start.availableBalance"),
          value: formatFcfa(progress.availableBalance),
        },
        {
          label: t("start.pendingRefund"),
          value: formatFcfa(progress.pendingRefund),
        },
        {
          label: t("start.commissionEarned"),
          value: formatFcfa(progress.commissionEarned),
          tone: "commission",
        },
      ]
    : [];

  return (
    <Layout title={t("start.title")}>
      <VipHero vipLabel={vipLabel(progress?.vipLevel ?? VipLevel.vip0)} />

      <PageContainer className="pt-5">
        {progressQuery.isLoading ? (
          <ListSkeleton rows={2} />
        ) : progressQuery.isError ? (
          <ErrorState
            message={t("common.error")}
            retryLabel={t("common.retry")}
            onRetry={() => void progressQuery.refetch()}
          />
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <PrimaryCta
                type="button"
                data-ocid="start.primary_button"
                onClick={() => setConfirmOpen(true)}
                disabled={busy || quotaReached || gated}
                className="disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
              >
                {busy ? (
                  t("start.ctaBusy")
                ) : blocked ? (
                  <>
                    <Ban className="size-5" aria-hidden />
                    {t("start.cta")}
                  </>
                ) : quotaReached ? (
                  <>
                    <CheckCircle2 className="size-5" aria-hidden />
                    {t("start.completedTasks")}
                  </>
                ) : (
                  <>
                    <Play className="size-5" aria-hidden />
                    {t("start.cta")}
                  </>
                )}
              </PrimaryCta>

              {blocked ? (
                <p
                  data-ocid="start.blocked_notice"
                  className="flex items-start justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-foreground"
                >
                  <Ban
                    className="mt-0.5 size-4 shrink-0 text-destructive"
                    aria-hidden
                  />
                  {t("start.blocked")}
                </p>
              ) : insufficientBalance ? (
                <p
                  data-ocid="start.insufficient_notice"
                  className="flex items-start justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-foreground"
                >
                  <Wallet
                    className="mt-0.5 size-4 shrink-0 text-destructive"
                    aria-hidden
                  />
                  {t("start.insufficientBalance")}
                </p>
              ) : null}

              {quotaReached && !gated ? (
                <p
                  data-ocid="start.quota_notice"
                  className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm font-medium text-foreground"
                >
                  {t("start.quotaReached")}
                </p>
              ) : null}

              {justCompleted && !quotaReached && !gated ? (
                <p
                  data-ocid="start.success_state"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm font-medium text-foreground"
                >
                  <Sparkles className="size-4 text-success" aria-hidden />
                  {t("start.success")}
                </p>
              ) : null}

              {startTask.isError ? (
                <ErrorState
                  message={t("common.error")}
                  retryLabel={t("common.retry")}
                  onRetry={handleConfirm}
                />
              ) : null}
            </div>

            {requestedRecharge !== null ? (
              <SurfaceCard
                data-ocid="start.recharge_card"
                className="space-y-3 border-primary/30 bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                  >
                    <Wallet className="size-4" />
                  </span>
                  <h2 className="font-display text-base font-bold text-foreground">
                    {t("start.rechargeRequested")}
                  </h2>
                </div>
                <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                  {formatFcfa(requestedRecharge)}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("start.rechargeHint")}
                </p>
                <PrimaryCta
                  type="button"
                  data-ocid="start.recharge_service_button"
                  onClick={() => void navigate({ to: "/service" })}
                >
                  <MessageCircle className="size-5" aria-hidden />
                  {t("service.title")}
                </PrimaryCta>
              </SurfaceCard>
            ) : null}

            <StatGrid stats={stats} />

            <section data-ocid="start.markets_section">
              <SectionHeading>{t("start.markets")}</SectionHeading>
              <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("start.rule1")}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("start.rule2")}
                </p>
              </div>
            </section>
          </div>
        )}
      </PageContainer>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("start.confirmTitle")}
        description={t("start.confirmBody")}
        confirmLabel={t("start.confirmBuy")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirm}
        pending={busy}
        ocid="start.confirm_dialog"
      />
    </Layout>
  );
}
