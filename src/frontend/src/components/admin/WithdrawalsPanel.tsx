import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  SurfaceCard,
} from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import {
  useApproveWithdrawal,
  usePendingWithdrawals,
  useRejectWithdrawal,
} from "@/lib/api";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { Check, Wallet, X } from "lucide-react";

export function WithdrawalsPanel() {
  const { t } = useTranslation();
  const withdrawals = usePendingWithdrawals(true);
  const approve = useApproveWithdrawal();
  const reject = useRejectWithdrawal();

  if (withdrawals.isLoading) return <ListSkeleton rows={3} />;
  if (withdrawals.isError) {
    return (
      <ErrorState
        message={t("common.error")}
        retryLabel={t("common.retry")}
        onRetry={() => void withdrawals.refetch()}
      />
    );
  }

  const rows = withdrawals.data ?? [];

  if (rows.length === 0) {
    return (
      <div data-ocid="admin.withdrawals_panel">
        <EmptyState
          title={t("admin.withdrawalsEmpty")}
          icon={<Wallet className="size-5" aria-hidden />}
        />
      </div>
    );
  }

  return (
    <ul data-ocid="admin.withdrawals_panel" className="space-y-3">
      {rows.map((row, index) => (
        <li key={row.id.toString()}>
          <SurfaceCard
            data-ocid={`admin.withdrawal_row.${index + 1}`}
            className="space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-destructive">
                  {formatFcfa(row.amount)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("admin.requestedAt")} {formatDateTime(row.createdAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                #{row.id.toString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                data-ocid={`admin.approve_button.${index + 1}`}
                onClick={() => approve.mutate(row.id)}
                disabled={approve.isPending || reject.isPending}
                className="h-10 rounded-full bg-success font-bold text-success-foreground hover:bg-success/90"
              >
                <Check className="size-4" aria-hidden />
                {t("admin.approve")}
              </Button>
              <Button
                type="button"
                variant="outline"
                data-ocid={`admin.reject_button.${index + 1}`}
                onClick={() => reject.mutate(row.id)}
                disabled={approve.isPending || reject.isPending}
                className="h-10 rounded-full border-destructive/40 font-bold text-destructive hover:bg-destructive/10"
              >
                <X className="size-4" aria-hidden />
                {t("admin.reject")}
              </Button>
            </div>
          </SurfaceCard>
        </li>
      ))}
    </ul>
  );
}
