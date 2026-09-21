import { FieldError, PrimaryCta } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestWithdrawal } from "@/lib/api";
import {
  MIN_WITHDRAWAL_AMOUNT,
  formatFcfa,
  parseAmountInput,
} from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { CheckCircle2, Lock } from "lucide-react";
import { type FormEvent, useState } from "react";

export function WithdrawDialog({
  open,
  onOpenChange,
  availableBalance,
  canWithdraw,
  lockReason,
  onGoToStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: bigint;
  canWithdraw: boolean;
  lockReason?: "quota" | "blocked" | "balance" | null;
  onGoToStart: () => void;
}) {
  const { t } = useTranslation();
  const requestWithdrawal = useRequestWithdrawal();
  const [amount, setAmount] = useState("");
  const [secondaryPassword, setSecondaryPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const reset = () => {
    setAmount("");
    setSecondaryPassword("");
    setError(null);
    setSucceeded(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = parseAmountInput(amount);
    if (parsed === null || parsed <= 0n) {
      setError(t("account.err.amountRequired"));
      return;
    }
    if (parsed < MIN_WITHDRAWAL_AMOUNT) {
      setError(t("account.err.minimum"));
      return;
    }
    if (parsed > availableBalance) {
      setError(t("account.err.insufficient"));
      return;
    }
    if (secondaryPassword.trim().length === 0) {
      setError(t("account.err.secondaryRequired"));
      return;
    }

    const capturedAmount = amount;
    const capturedPassword = secondaryPassword;
    setAmount("");
    setSecondaryPassword("");

    requestWithdrawal.mutate(
      { amount: parsed, secondaryPassword: capturedPassword },
      {
        onSuccess: () => setSucceeded(true),
        onError: (mutationError) => {
          const message = String(mutationError?.message ?? "");
          if (message.includes("Mot de passe secondaire incorrect")) {
            setError(t("account.passwordWrong"));
          } else if (message.includes("Taches journalieres incompletes")) {
            setError(t("account.withdrawLocked"));
          } else if (message.includes("Solde insuffisant")) {
            setError(t("account.err.insufficient"));
          } else if (
            message.includes("Le montant minimum de retrait est de 2000 FCFA")
          ) {
            setError(t("account.err.minimum"));
          } else if (message.includes("Account is blocked")) {
            setError(t("account.blockedBody"));
          } else {
            setError(t("common.error"));
          }
          setAmount((current) => (current === "" ? capturedAmount : current));
          setSecondaryPassword((current) =>
            current === "" ? capturedPassword : current,
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="account.withdraw.dialog"
        className="rounded-2xl border-border bg-card"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {t("account.withdrawTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("account.balance")} · {formatFcfa(availableBalance)}
          </DialogDescription>
        </DialogHeader>

        {succeeded ? (
          <div
            data-ocid="account.withdraw.success_state"
            className="flex flex-col items-center gap-3 py-4 text-center"
          >
            <CheckCircle2 className="size-8 text-success" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              {t("account.withdrawSuccess")}
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              data-ocid="account.withdraw.close_button"
              onClick={() => handleOpenChange(false)}
            >
              {t("common.close")}
            </Button>
          </div>
        ) : !canWithdraw ? (
          <div
            data-ocid="account.withdraw.locked_state"
            className="flex flex-col items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-5 text-center"
          >
            <Lock className="size-6 text-warning-foreground" aria-hidden />
            <p className="text-sm text-foreground">
              {lockReason === "blocked"
                ? t("account.blockedBody")
                : lockReason === "balance"
                  ? t("account.err.insufficient")
                  : t("account.withdrawLocked")}
            </p>
            {lockReason === "quota" ? (
              <Button
                type="button"
                className="rounded-full"
                data-ocid="account.withdraw.locked_cta"
                onClick={() => {
                  handleOpenChange(false);
                  onGoToStart();
                }}
              >
                {t("account.withdrawLockedCta")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                data-ocid="account.withdraw.locked_close_button"
                onClick={() => handleOpenChange(false)}
              >
                {t("common.close")}
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">
                {t("account.withdrawAmount")}
              </Label>
              <Input
                id="withdraw-amount"
                data-ocid="account.withdraw.amount_input"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-describedby="withdraw-amount-hint"
                className="h-12 rounded-xl text-base"
              />
              <p
                id="withdraw-amount-hint"
                className="text-xs text-muted-foreground"
              >
                {t("account.withdrawMinHint", {
                  amount: formatFcfa(MIN_WITHDRAWAL_AMOUNT),
                })}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-secondary">
                {t("account.withdrawSecondary")}
              </Label>
              <Input
                id="withdraw-secondary"
                data-ocid="account.withdraw.secondary_input"
                type="password"
                autoComplete="off"
                value={secondaryPassword}
                onChange={(event) => setSecondaryPassword(event.target.value)}
                className="h-12 rounded-xl text-base"
              />
            </div>

            <FieldError>{error}</FieldError>

            <PrimaryCta
              type="submit"
              data-ocid="account.withdraw.submit_button"
              disabled={requestWithdrawal.isPending}
            >
              {requestWithdrawal.isPending
                ? t("common.loading")
                : t("account.withdrawSubmit")}
            </PrimaryCta>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
