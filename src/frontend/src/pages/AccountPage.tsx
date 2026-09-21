import type { WithdrawalStatus } from "@/backend";
import { Layout } from "@/components/Layout";
import { ServiceGrid, type ServiceItem } from "@/components/ServiceGrid";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import {
  DarkButton,
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageContainer,
  PrimaryCta,
  SectionHeading,
  StatusPill,
  SurfaceCard,
} from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDailyProgress, useMyAccount, useMyWithdrawals } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime, formatFcfa, withdrawalStatusKey } from "@/lib/format";
import { type TranslationKey, useTranslation } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  Copy,
  FileText,
  Info,
  KeyRound,
  LogOut,
  MessageSquare,
  Phone,
  ScrollText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useState } from "react";

type PanelId = "detailed" | "withdrawNumber" | "password" | "rule" | "about";

const STATUS_TONES: Record<
  WithdrawalStatus,
  "neutral" | "success" | "danger" | "warning"
> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, account: sessionAccount, signOut } = useAuth();

  const accountQuery = useMyAccount(isAuthenticated);
  const progressQuery = useDailyProgress(isAuthenticated);
  const withdrawalsQuery = useMyWithdrawals(isAuthenticated);

  const account = accountQuery.data ?? sessionAccount;
  const progress = progressQuery.data ?? null;
  const withdrawals = withdrawalsQuery.data ?? [];

  const [copied, setCopied] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [panel, setPanel] = useState<PanelId | null>(null);

  const isBlocked = account?.blocked === true;
  const hasBalance = (account?.balance ?? 0n) > 0n;
  const quotaReached = progress?.canStartTask === false;
  const canWithdraw = quotaReached && !isBlocked && hasBalance;
  const withdrawLockReason: "quota" | "blocked" | "balance" | null = canWithdraw
    ? null
    : isBlocked
      ? "blocked"
      : !hasBalance
        ? "balance"
        : "quota";

  const handleCopy = () => {
    if (!account) return;
    void navigator.clipboard
      .writeText(account.promoCode)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  const handleLogout = () => {
    signOut();
    void navigate({ to: "/login", replace: true });
  };

  const services: ServiceItem[] = [
    {
      id: "detailed",
      label: t("account.detailed"),
      icon: FileText,
      onSelect: () => setPanel("detailed"),
    },
    {
      id: "withdraw_number",
      label: t("account.withdrawNumber"),
      icon: Phone,
      onSelect: () => setPanel("withdrawNumber"),
    },
    {
      id: "password",
      label: t("account.password"),
      icon: KeyRound,
      onSelect: () => setPanel("password"),
    },
    {
      id: "withdraw",
      label: t("account.withdraw"),
      icon: Wallet,
      onSelect: () => setWithdrawOpen(true),
    },
    {
      id: "rule",
      label: t("account.rule"),
      icon: ScrollText,
      onSelect: () => setPanel("rule"),
    },
    {
      id: "about",
      label: t("account.about"),
      icon: Info,
      onSelect: () => setPanel("about"),
    },
    {
      id: "message",
      label: t("account.message"),
      icon: MessageSquare,
      onSelect: () => void navigate({ to: "/service" }),
    },
    {
      id: "exit",
      label: t("account.exit"),
      icon: LogOut,
      tone: "danger",
      onSelect: handleLogout,
    },
  ];

  return (
    <Layout title={t("account.title")}>
      <PageContainer data-ocid="account.page">
        {accountQuery.isLoading && !account ? (
          <ListSkeleton rows={2} />
        ) : accountQuery.isError && !account ? (
          <ErrorState
            message={t("common.error")}
            retryLabel={t("common.retry")}
            onRetry={() => void accountQuery.refetch()}
          />
        ) : account ? (
          <div className="space-y-4">
            {/* Profile card */}
            <SurfaceCard data-ocid="account.profile.card">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xl font-bold text-secondary-foreground"
                >
                  {account.phone.slice(-2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-foreground">
                    {account.phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("home.vipBadge", {
                      level: account.vipLevel.replace("vip", ""),
                    })}
                  </p>
                </div>
                <BadgeCheck
                  className="size-5 shrink-0 text-primary"
                  aria-hidden
                />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div className="min-w-0">
                  <dt className="text-[11px] text-muted-foreground">
                    {t("home.phone")}
                  </dt>
                  <dd className="truncate font-display text-sm font-bold text-foreground">
                    {account.phone}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] text-muted-foreground">
                    {t("home.creditScore")}
                  </dt>
                  <dd className="font-display text-sm font-bold text-foreground">
                    {account.creditScore.toString()}
                  </dd>
                </div>
                <div className="col-span-2 min-w-0">
                  <dt className="text-[11px] text-muted-foreground">
                    {t("home.promoCode")}
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="truncate font-mono text-sm font-bold tracking-wider text-foreground">
                      {account.promoCode}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-ocid="account.promo.copy_button"
                      onClick={handleCopy}
                      className="h-7 shrink-0 rounded-full px-3 text-xs"
                    >
                      {copied ? (
                        <Check className="size-3.5" aria-hidden />
                      ) : (
                        <Copy className="size-3.5" aria-hidden />
                      )}
                      {copied ? t("common.copied") : t("common.copy")}
                    </Button>
                  </dd>
                </div>
              </dl>
            </SurfaceCard>

            {/* Balance card */}
            <SurfaceCard
              data-ocid="account.balance.card"
              className="bg-chrome-gradient text-secondary-foreground"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-secondary-foreground/70">
                    {t("account.balance")}
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold tracking-tight">
                    {formatFcfa(account.balance)}
                  </p>
                </div>
                <PrimaryCta
                  type="button"
                  data-ocid="account.withdraw.open_modal_button"
                  onClick={() => setWithdrawOpen(true)}
                  className="h-11 w-auto shrink-0 px-6"
                >
                  {t("account.withdraw")}
                </PrimaryCta>
              </div>
            </SurfaceCard>

            {/* Services */}
            <section>
              <SectionHeading>{t("account.services")}</SectionHeading>
              <ServiceGrid items={services} />
            </section>

            {/* Withdrawal history */}
            <section>
              <SectionHeading>{t("account.withdrawHistory")}</SectionHeading>
              {withdrawalsQuery.isLoading ? (
                <ListSkeleton rows={2} />
              ) : withdrawalsQuery.isError ? (
                <ErrorState
                  message={t("common.error")}
                  retryLabel={t("common.retry")}
                  onRetry={() => void withdrawalsQuery.refetch()}
                />
              ) : withdrawals.length === 0 ? (
                <EmptyState
                  title={t("account.withdrawEmpty")}
                  icon={<Wallet className="size-5" aria-hidden />}
                />
              ) : (
                <ul data-ocid="account.withdraw.list" className="space-y-2">
                  {withdrawals.map((withdrawal, index) => (
                    <li key={withdrawal.id.toString()}>
                      <SurfaceCard
                        data-ocid={`account.withdraw.item.${index + 1}`}
                        className="flex items-center justify-between gap-3 p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-display text-base font-bold text-destructive">
                            {formatFcfa(withdrawal.amount)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDateTime(withdrawal.createdAt)}
                          </p>
                        </div>
                        <StatusPill
                          label={t(
                            withdrawalStatusKey(
                              withdrawal.status,
                            ) as TranslationKey,
                          )}
                          tone={STATUS_TONES[withdrawal.status]}
                        />
                      </SurfaceCard>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <EmptyState title={t("common.empty")} />
        )}
      </PageContainer>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableBalance={account?.balance ?? 0n}
        canWithdraw={canWithdraw}
        lockReason={withdrawLockReason}
        onGoToStart={() => void navigate({ to: "/start" })}
      />

      <AccountPanel
        panel={panel}
        onClose={() => setPanel(null)}
        onGoToStart={() => {
          setPanel(null);
          void navigate({ to: "/start" });
        }}
      />
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Informational panels                                                */
/* ------------------------------------------------------------------ */

function AccountPanel({
  panel,
  onClose,
  onGoToStart,
}: {
  panel: PanelId | null;
  onClose: () => void;
  onGoToStart: () => void;
}) {
  const { t } = useTranslation();

  const titles: Record<PanelId, TranslationKey> = {
    detailed: "account.detailedTitle",
    withdrawNumber: "account.withdrawNumberTitle",
    password: "account.passwordTitle",
    rule: "account.ruleTitle",
    about: "account.aboutTitle",
  };

  return (
    <Dialog open={panel !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-ocid="account.panel.dialog"
        className="rounded-2xl border-border bg-card"
      >
        {panel ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">
                {t(titles[panel])}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t(titles[panel])}
              </DialogDescription>
            </DialogHeader>

            {panel === "password" ? (
              <div
                data-ocid="account.password.admin_only_state"
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-6 text-center"
              >
                <span
                  aria-hidden
                  className="flex size-11 items-center justify-center rounded-full bg-card text-primary shadow-xs"
                >
                  <ShieldCheck className="size-5" />
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("account.passwordAdminOnly")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  data-ocid="account.password.contact_button"
                  onClick={onClose}
                >
                  {t("common.close")}
                </Button>
              </div>
            ) : panel === "detailed" ? (
              <div
                data-ocid="account.detailed.empty_state"
                className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  {t("account.detailedEmpty")}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {panel === "rule"
                  ? t("account.ruleBody")
                  : panel === "about"
                    ? t("account.aboutBody")
                    : t("account.withdrawNumberBody")}
              </p>
            )}

            {panel === "rule" ? (
              <DarkButton
                type="button"
                data-ocid="account.panel.start_button"
                onClick={onGoToStart}
              >
                {t("account.withdrawLockedCta")}
              </DarkButton>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
