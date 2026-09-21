import type { AdminAccountRow } from "@/backend";
import { VipLevel } from "@/backend";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FieldError,
  ListSkeleton,
  StatusPill,
  SurfaceCard,
} from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAccounts,
  useAddMoney,
  useClearRechargeRequest,
  useCreditRecharge,
  useGrantCommission,
  useRemoveMoney,
  useSetAccountBlocked,
  useSetPendingRefund,
  useSetRechargeRequest,
  useSetSecondaryPassword,
  useSetVipLevel,
} from "@/lib/api";
import { formatFcfa, parseAmountInput, vipLabel } from "@/lib/format";
import { type TranslationKey, useTranslation } from "@/lib/i18n";
import {
  Ban,
  CircleDollarSign,
  Eye,
  EyeOff,
  KeyRound,
  Minus,
  Plus,
  RotateCcw,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

type MoneyAction =
  | "add"
  | "remove"
  | "commission"
  | "rechargeRequest"
  | "creditRecharge"
  | "refund";

const VIP_LEVELS: VipLevel[] = [
  VipLevel.vip0,
  VipLevel.vip1,
  VipLevel.vip2,
  VipLevel.vip3,
];

const ACTION_LABEL: Record<MoneyAction, TranslationKey> = {
  add: "admin.addMoney",
  remove: "admin.removeMoney",
  commission: "admin.grantCommission",
  rechargeRequest: "admin.rechargeRequest",
  creditRecharge: "admin.creditRecharge",
  refund: "admin.setPendingRefund",
};

const ACTION_AMOUNT_LABEL: Record<MoneyAction, TranslationKey> = {
  add: "admin.amount",
  remove: "admin.amount",
  commission: "admin.amount",
  rechargeRequest: "admin.rechargeRequestAmount",
  creditRecharge: "admin.creditRechargeAmount",
  refund: "admin.pendingRefundAmount",
};

/** Minimum length enforced for every password on the platform. */
const MIN_PASSWORD_LENGTH = 8;

export function AccountsPanel() {
  const { t } = useTranslation();
  const accounts = useAccounts(true);
  const addMoney = useAddMoney();
  const removeMoney = useRemoveMoney();
  const grantCommission = useGrantCommission();
  const setVipLevel = useSetVipLevel();
  const setRechargeRequest = useSetRechargeRequest();
  const clearRechargeRequest = useClearRechargeRequest();
  const creditRecharge = useCreditRecharge();
  const setPendingRefund = useSetPendingRefund();
  const setAccountBlocked = useSetAccountBlocked();
  const setSecondaryPassword = useSetSecondaryPassword();

  const [target, setTarget] = useState<AdminAccountRow | null>(null);
  const [action, setAction] = useState<MoneyAction>("add");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [passwordTarget, setPasswordTarget] = useState<AdminAccountRow | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [blockTarget, setBlockTarget] = useState<AdminAccountRow | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const openDialog = (row: AdminAccountRow, next: MoneyAction) => {
    setTarget(row);
    setAction(next);
    setAmount(
      next === "rechargeRequest" && row.requestedRecharge !== undefined
        ? row.requestedRecharge.toString()
        : "",
    );
    setError(null);
  };

  const closeDialog = () => {
    setTarget(null);
    setAmount("");
    setError(null);
  };

  const openPasswordDialog = (row: AdminAccountRow) => {
    setPasswordTarget(row);
    setNewPassword("");
    setPasswordError(null);
  };

  const closePasswordDialog = () => {
    setPasswordTarget(null);
    setNewPassword("");
    setPasswordError(null);
  };

  const pending =
    addMoney.isPending ||
    removeMoney.isPending ||
    grantCommission.isPending ||
    setRechargeRequest.isPending ||
    clearRechargeRequest.isPending ||
    creditRecharge.isPending ||
    setPendingRefund.isPending;

  const clearRequest = (row: AdminAccountRow) => {
    clearRechargeRequest.mutate({ userId: row.id });
  };

  const submit = () => {
    if (!target) return;
    const parsed = parseAmountInput(amount);
    if (parsed === null || parsed <= 0n) {
      setError(t("admin.err.amountRequired"));
      return;
    }
    const payload = { userId: target.id, amount: parsed };
    const mutation =
      action === "add"
        ? addMoney
        : action === "remove"
          ? removeMoney
          : action === "commission"
            ? grantCommission
            : action === "rechargeRequest"
              ? setRechargeRequest
              : action === "creditRecharge"
                ? creditRecharge
                : setPendingRefund;
    mutation.mutate(payload, {
      onSuccess: () => closeDialog(),
      onError: () => setError(t("common.error")),
    });
  };

  const submitPassword = () => {
    if (!passwordTarget) return;
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t("auth.err.secondaryLength"));
      return;
    }
    setSecondaryPassword.mutate(
      { userId: passwordTarget.id, newPassword },
      {
        onSuccess: () => closePasswordDialog(),
        onError: () => setPasswordError(t("common.error")),
      },
    );
  };

  const toggleReveal = (key: string) => {
    setRevealed((current) => ({ ...current, [key]: !current[key] }));
  };

  if (accounts.isLoading) return <ListSkeleton rows={4} />;
  if (accounts.isError) {
    return (
      <ErrorState
        message={t("common.error")}
        retryLabel={t("common.retry")}
        onRetry={() => void accounts.refetch()}
      />
    );
  }

  const rows = accounts.data ?? [];

  return (
    <div data-ocid="admin.accounts_panel" className="space-y-3">
      {rows.length === 0 ? (
        <EmptyState
          title={t("admin.accountsEmpty")}
          icon={<Users className="size-5" aria-hidden />}
        />
      ) : (
        <ul data-ocid="admin.accounts_list" className="space-y-3">
          {rows.map((row, index) => {
            const position = index + 1;
            const passwordKey = `password-${row.id.toString()}`;
            const secondaryKey = `secondary-${row.id.toString()}`;
            const isRevealed = revealed[passwordKey] === true;
            const isSecondaryRevealed = revealed[secondaryKey] === true;
            return (
              <li key={row.id.toString()}>
                <SurfaceCard
                  data-ocid={`admin.account_row.${position}`}
                  className="space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold text-foreground">
                        {row.phone}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("admin.vipLevel")} · {vipLabel(row.vipLevel)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={
                          row.isOnline
                            ? "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success"
                            : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                        }
                      >
                        <span
                          className={
                            row.isOnline
                              ? "size-1.5 rounded-full bg-success"
                              : "size-1.5 rounded-full bg-muted-foreground"
                          }
                          aria-hidden
                        />
                        {row.isOnline ? t("admin.online") : t("admin.offline")}
                      </span>
                      {row.blocked ? (
                        <StatusPill label={t("admin.blocked")} tone="danger" />
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between rounded-xl bg-stat px-3 py-2.5">
                    <span className="text-[11px] font-medium text-stat-muted">
                      {t("admin.balance")}
                    </span>
                    <span className="font-display text-base font-bold text-stat-foreground">
                      {formatFcfa(row.balance)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {t("admin.requestedRecharge")}
                      </p>
                      <p className="mt-0.5 font-display text-sm font-bold text-foreground">
                        {row.requestedRecharge !== undefined &&
                        row.requestedRecharge > 0n
                          ? formatFcfa(row.requestedRecharge)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {t("admin.pendingRefund")}
                      </p>
                      <p className="mt-0.5 font-display text-sm font-bold text-foreground">
                        {formatFcfa(row.pendingRefund)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                    <CredentialRow
                      label={t("admin.password")}
                      value={row.password}
                      revealed={isRevealed}
                      onToggle={() => toggleReveal(passwordKey)}
                      ocid={`admin.password.${position}`}
                      toggleOcid={`admin.password_toggle.${position}`}
                      showLabel={t("admin.showPassword")}
                      hideLabel={t("admin.hidePassword")}
                    />
                    <CredentialRow
                      label={t("admin.secondaryPassword")}
                      value={row.secondaryPassword}
                      revealed={isSecondaryRevealed}
                      onToggle={() => toggleReveal(secondaryKey)}
                      ocid={`admin.secondary_password.${position}`}
                      toggleOcid={`admin.secondary_password_toggle.${position}`}
                      showLabel={t("admin.showPassword")}
                      hideLabel={t("admin.hidePassword")}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.add_money_button.${position}`}
                      onClick={() => openDialog(row, "add")}
                      className="h-9 rounded-full px-2 text-xs font-semibold"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      {t("admin.addMoney")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.remove_money_button.${position}`}
                      onClick={() => openDialog(row, "remove")}
                      className="h-9 rounded-full px-2 text-xs font-semibold"
                    >
                      <Minus className="size-3.5" aria-hidden />
                      {t("admin.removeMoney")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.grant_commission_button.${position}`}
                      onClick={() => openDialog(row, "commission")}
                      className="h-9 rounded-full px-2 text-xs font-semibold"
                    >
                      <CircleDollarSign className="size-3.5" aria-hidden />
                      {t("admin.grantCommission")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.recharge_request_button.${position}`}
                      onClick={() => openDialog(row, "rechargeRequest")}
                      className="h-9 rounded-full px-2 text-xs font-semibold"
                    >
                      <Wallet className="size-3.5" aria-hidden />
                      {t("admin.rechargeRequest")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.credit_recharge_button.${position}`}
                      onClick={() => openDialog(row, "creditRecharge")}
                      className="h-9 rounded-full px-2 text-xs font-semibold"
                    >
                      <CircleDollarSign className="size-3.5" aria-hidden />
                      {t("admin.creditRecharge")}
                    </Button>
                  </div>

                  {row.requestedRecharge !== undefined &&
                  row.requestedRecharge > 0n ? (
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.clear_recharge_button.${position}`}
                      onClick={() => clearRequest(row)}
                      disabled={clearRechargeRequest.isPending}
                      className="h-9 w-full rounded-full border-destructive/40 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <X className="size-3.5" aria-hidden />
                      {t("admin.clearRechargeRequest")}
                    </Button>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.pending_refund_button.${position}`}
                      onClick={() => openDialog(row, "refund")}
                      className="h-9 rounded-full px-2 text-xs font-semibold"
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                      {t("admin.setPendingRefund")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.set_secondary_password_button.${position}`}
                      onClick={() => openPasswordDialog(row)}
                      className="h-9 rounded-full px-2 text-xs font-semibold"
                    >
                      <KeyRound className="size-3.5" aria-hidden />
                      {t("admin.setSecondaryPassword")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid={`admin.block_button.${position}`}
                      onClick={() => setBlockTarget(row)}
                      className={
                        row.blocked
                          ? "h-9 rounded-full border-success/40 px-2 text-xs font-semibold text-success hover:bg-success/10"
                          : "h-9 rounded-full border-destructive/40 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                      }
                    >
                      <Ban className="size-3.5" aria-hidden />
                      {row.blocked ? t("admin.unblock") : t("admin.block")}
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`vip-select-${row.id.toString()}`}
                      className="text-[11px] font-medium text-muted-foreground"
                    >
                      {t("admin.setVip")}
                    </Label>
                    <select
                      id={`vip-select-${row.id.toString()}`}
                      data-ocid={`admin.vip_select.${position}`}
                      value={row.vipLevel}
                      disabled={setVipLevel.isPending}
                      onChange={(event) =>
                        setVipLevel.mutate({
                          userId: row.id,
                          level: event.target.value as VipLevel,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                    >
                      {VIP_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {vipLabel(level)}
                        </option>
                      ))}
                    </select>
                  </div>
                </SurfaceCard>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent data-ocid="admin.amount_dialog" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t(ACTION_LABEL[action])}
            </DialogTitle>
            <DialogDescription>{target ? target.phone : ""}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="admin-amount-input">
              {t(ACTION_AMOUNT_LABEL[action])}
            </Label>
            <Input
              id="admin-amount-input"
              data-ocid="admin.amount_input"
              inputMode="decimal"
              autoComplete="off"
              placeholder={t("admin.amountPlaceholder")}
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(null);
              }}
            />
            <FieldError>{error}</FieldError>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.amount_cancel_button"
              onClick={closeDialog}
              className="rounded-full"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              data-ocid="admin.amount_confirm_button"
              onClick={submit}
              disabled={pending}
              className="rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              {t("admin.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordTarget !== null}
        onOpenChange={(open) => {
          if (!open) closePasswordDialog();
        }}
      >
        <DialogContent
          data-ocid="admin.secondary_password_dialog"
          className="max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {t("admin.setSecondaryPassword")}
            </DialogTitle>
            <DialogDescription>
              {passwordTarget ? passwordTarget.phone : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="admin-secondary-password-input">
              {t("admin.newSecondaryPassword")}
            </Label>
            <Input
              id="admin-secondary-password-input"
              data-ocid="admin.secondary_password_input"
              type="text"
              autoComplete="off"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setPasswordError(null);
              }}
            />
            <p className="text-[11px] text-muted-foreground">
              {t("auth.secondaryMinHint")}
            </p>
            <FieldError>{passwordError}</FieldError>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.secondary_password_cancel_button"
              onClick={closePasswordDialog}
              className="rounded-full"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              data-ocid="admin.secondary_password_confirm_button"
              onClick={submitPassword}
              disabled={setSecondaryPassword.isPending}
              className="rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={blockTarget !== null}
        onOpenChange={(open) => {
          if (!open) setBlockTarget(null);
        }}
        ocid="admin.block_dialog"
        title={
          blockTarget?.blocked
            ? t("admin.unblockConfirmTitle")
            : t("admin.blockConfirmTitle")
        }
        description={
          blockTarget?.blocked
            ? t("admin.unblockConfirmBody")
            : t("admin.blockConfirmBody")
        }
        confirmLabel={
          blockTarget?.blocked ? t("admin.unblock") : t("admin.block")
        }
        cancelLabel={t("common.cancel")}
        destructive={blockTarget?.blocked !== true}
        pending={setAccountBlocked.isPending}
        onConfirm={() => {
          if (!blockTarget) return;
          setAccountBlocked.mutate(
            { userId: blockTarget.id, blocked: !blockTarget.blocked },
            { onSuccess: () => setBlockTarget(null) },
          );
        }}
      />
    </div>
  );
}

function CredentialRow({
  label,
  value,
  revealed,
  onToggle,
  ocid,
  toggleOcid,
  showLabel,
  hideLabel,
}: {
  label: string;
  value: string;
  revealed: boolean;
  onToggle: () => void;
  ocid: string;
  toggleOcid: string;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p
          data-ocid={ocid}
          className="truncate font-mono text-sm font-semibold text-foreground"
        >
          {revealed ? value : "••••••••"}
        </p>
      </div>
      <button
        type="button"
        data-ocid={toggleOcid}
        onClick={onToggle}
        aria-label={revealed ? hideLabel : showLabel}
        aria-pressed={revealed}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {revealed ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
