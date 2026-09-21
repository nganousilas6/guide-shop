import { VipLevel } from "@/backend";
import {
  ErrorState,
  FieldError,
  ListSkeleton,
  SectionHeading,
  SurfaceCard,
} from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAccounts,
  useAssignTaskToUser,
  useAssignTaskToVip,
} from "@/lib/api";
import { parseAmountInput, vipLabel } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { ClipboardList } from "lucide-react";
import { useState } from "react";

const VIP_LEVELS: VipLevel[] = [
  VipLevel.vip0,
  VipLevel.vip1,
  VipLevel.vip2,
  VipLevel.vip3,
];

type Target = "user" | "vip";

export function TasksPanel() {
  const { t } = useTranslation();
  const accounts = useAccounts(true);
  const assignToUser = useAssignTaskToUser();
  const assignToVip = useAssignTaskToVip();

  const [target, setTarget] = useState<Target>("user");
  const [userId, setUserId] = useState("");
  const [level, setLevel] = useState<VipLevel>(VipLevel.vip0);
  const [merchant, setMerchant] = useState("");
  const [product, setProduct] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [assigned, setAssigned] = useState(false);

  const pending = assignToUser.isPending || assignToVip.isPending;

  const submit = () => {
    const value = parseAmountInput(totalValue);
    const fieldsFilled =
      merchant.trim() !== "" &&
      product.trim() !== "" &&
      thumbnail.trim() !== "" &&
      value !== null &&
      value > 0n;
    if (!fieldsFilled) {
      setError(t("admin.err.fieldsRequired"));
      return;
    }
    if (target === "user" && userId === "") {
      setError(t("admin.err.fieldsRequired"));
      return;
    }
    setError(null);

    const payload = {
      merchant: merchant.trim(),
      productDescription: product.trim(),
      thumbnailUrl: thumbnail.trim(),
      totalValue: value,
    };

    const onSuccess = () => {
      setMerchant("");
      setProduct("");
      setThumbnail("");
      setTotalValue("");
      setAssigned(true);
      window.setTimeout(() => setAssigned(false), 3000);
    };
    const onError = () => setError(t("common.error"));

    if (target === "user") {
      assignToUser.mutate(
        { userId: BigInt(userId), ...payload },
        { onSuccess, onError },
      );
    } else {
      assignToVip.mutate({ level, ...payload }, { onSuccess, onError });
    }
  };

  if (accounts.isLoading) return <ListSkeleton rows={3} />;
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
    <div data-ocid="admin.tasks_panel" className="space-y-3">
      <SectionHeading>{t("admin.tasksTitle")}</SectionHeading>

      <SurfaceCard className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-muted-foreground">
            {t("admin.taskTarget")}
          </Label>
          <div
            data-ocid="admin.task_target_toggle"
            className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1"
          >
            {(
              [
                ["user", "admin.taskTargetUser"],
                ["vip", "admin.taskTargetVip"],
              ] as const
            ).map(([value, key]) => (
              <button
                key={value}
                type="button"
                data-ocid={`admin.task_target.${value}`}
                onClick={() => {
                  setTarget(value);
                  setError(null);
                }}
                aria-pressed={target === value}
                className={
                  target === value
                    ? "rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-smooth"
                    : "rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:text-foreground"
                }
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>

        {target === "user" ? (
          <div className="space-y-1.5">
            <Label
              htmlFor="task-user-select"
              className="text-[11px] font-medium text-muted-foreground"
            >
              {t("admin.taskTargetUser")}
            </Label>
            <select
              id="task-user-select"
              data-ocid="admin.task_user_select"
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                setError(null);
              }}
              className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("admin.taskTargetUser")}</option>
              {rows.map((row) => (
                <option key={row.id.toString()} value={row.id.toString()}>
                  {row.phone} · {vipLabel(row.vipLevel)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label
              htmlFor="task-vip-select"
              className="text-[11px] font-medium text-muted-foreground"
            >
              {t("admin.taskTargetVip")}
            </Label>
            <select
              id="task-vip-select"
              data-ocid="admin.task_vip_select"
              value={level}
              onChange={(event) => setLevel(event.target.value as VipLevel)}
              className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {VIP_LEVELS.map((vip) => (
                <option key={vip} value={vip}>
                  {vipLabel(vip)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label
            htmlFor="task-merchant"
            className="text-[11px] font-medium text-muted-foreground"
          >
            {t("admin.merchant")}
          </Label>
          <Input
            id="task-merchant"
            data-ocid="admin.task_merchant_input"
            autoComplete="off"
            value={merchant}
            onChange={(event) => {
              setMerchant(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="task-product"
            className="text-[11px] font-medium text-muted-foreground"
          >
            {t("admin.product")}
          </Label>
          <Input
            id="task-product"
            data-ocid="admin.task_product_input"
            autoComplete="off"
            value={product}
            onChange={(event) => {
              setProduct(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="task-thumbnail"
            className="text-[11px] font-medium text-muted-foreground"
          >
            {t("admin.thumbnail")}
          </Label>
          <Input
            id="task-thumbnail"
            data-ocid="admin.task_thumbnail_input"
            autoComplete="off"
            placeholder="https://"
            value={thumbnail}
            onChange={(event) => {
              setThumbnail(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="task-value"
            className="text-[11px] font-medium text-muted-foreground"
          >
            {t("admin.totalValue")}
          </Label>
          <Input
            id="task-value"
            data-ocid="admin.task_value_input"
            inputMode="decimal"
            autoComplete="off"
            value={totalValue}
            onChange={(event) => {
              setTotalValue(event.target.value);
              setError(null);
            }}
          />
        </div>

        <FieldError>{error}</FieldError>

        <Button
          type="button"
          data-ocid="admin.assign_task_button"
          onClick={submit}
          disabled={pending}
          className="h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
        >
          <ClipboardList className="size-4" aria-hidden />
          {t("admin.assign")}
        </Button>

        {assigned ? (
          <p
            data-ocid="success_state"
            className="text-center text-xs font-semibold text-success"
          >
            {t("admin.taskAssigned")}
          </p>
        ) : null}
      </SurfaceCard>
    </div>
  );
}
