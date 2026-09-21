import type { VipConfig } from "@/backend";
import { VipLevel } from "@/backend";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  SectionHeading,
  SurfaceCard,
} from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetVipConfig, useVipConfigs } from "@/lib/api";
import { formatCommissionRate, vipLabel } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const VIP_LEVELS: VipLevel[] = [
  VipLevel.vip0,
  VipLevel.vip1,
  VipLevel.vip2,
  VipLevel.vip3,
];

type Draft = { quota: string; rate: string };

/** Backend defaults for VIP0 when no configuration row exists yet. */
const VIP0_DEFAULT_QUOTA = 30n;
const VIP0_DEFAULT_RATE = 500n;

function draftFromConfig(
  level: VipLevel,
  config: VipConfig | undefined,
): Draft {
  if (!config) {
    return level === VipLevel.vip0
      ? {
          quota: VIP0_DEFAULT_QUOTA.toString(),
          rate: VIP0_DEFAULT_RATE.toString(),
        }
      : { quota: "", rate: "" };
  }
  return {
    quota: config.dailyTaskQuota.toString(),
    rate: config.commissionRate.toString(),
  };
}

function VipConfigRow({
  level,
  config,
  index,
}: {
  level: VipLevel;
  config: VipConfig | undefined;
  index: number;
}) {
  const { t } = useTranslation();
  const setVipConfig = useSetVipConfig();
  const [draft, setDraft] = useState<Draft>(() =>
    draftFromConfig(level, config),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = () => {
    const quota = Number.parseInt(draft.quota, 10);
    const rate = Number.parseInt(draft.rate.replace(/\s/g, ""), 10);
    if (
      !Number.isFinite(quota) ||
      quota < 0 ||
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      setError(t("admin.err.amountRequired"));
      return;
    }
    setError(null);
    setVipConfig.mutate(
      {
        level,
        dailyTaskQuota: BigInt(Math.trunc(quota)),
        commissionRate: BigInt(Math.trunc(rate)),
      },
      {
        onSuccess: () => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 3000);
        },
        onError: () => setError(t("common.error")),
      },
    );
  };

  return (
    <SurfaceCard data-ocid={`admin.vip_row.${index + 1}`} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 font-display text-xs font-bold text-secondary-foreground">
          {vipLabel(level)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {t("admin.commissionRate")} ·{" "}
          {formatCommissionRate(config?.commissionRate ?? 0n)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor={`vip-quota-${level}`}
            className="text-[11px] font-medium text-muted-foreground"
          >
            {t("admin.dailyQuota")}
          </Label>
          <Input
            id={`vip-quota-${level}`}
            data-ocid={`admin.vip_quota_input.${index + 1}`}
            inputMode="numeric"
            autoComplete="off"
            value={draft.quota}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                quota: event.target.value,
              }));
              setError(null);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor={`vip-rate-${level}`}
            className="text-[11px] font-medium text-muted-foreground"
          >
            {t("admin.commissionRate")}
          </Label>
          <Input
            id={`vip-rate-${level}`}
            data-ocid={`admin.vip_rate_input.${index + 1}`}
            inputMode="numeric"
            autoComplete="off"
            value={draft.rate}
            onChange={(event) => {
              setDraft((current) => ({ ...current, rate: event.target.value }));
              setError(null);
            }}
          />
        </div>
      </div>

      {error ? (
        <p
          data-ocid="error_state"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          data-ocid={`admin.vip_save_button.${index + 1}`}
          onClick={submit}
          disabled={setVipConfig.isPending}
          className="h-10 flex-1 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
        >
          {t("common.save")}
        </Button>
        {saved ? (
          <span
            data-ocid="success_state"
            className="text-xs font-semibold text-success"
          >
            {t("admin.vipSaved")}
          </span>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

export function VipPanel() {
  const { t } = useTranslation();
  const configs = useVipConfigs(true);

  if (configs.isLoading) return <ListSkeleton rows={4} />;
  if (configs.isError) {
    return (
      <ErrorState
        message={t("common.error")}
        retryLabel={t("common.retry")}
        onRetry={() => void configs.refetch()}
      />
    );
  }

  const rows = configs.data ?? [];

  return (
    <div data-ocid="admin.vip_panel" className="space-y-3">
      <SectionHeading>{t("admin.vipTitle")}</SectionHeading>
      {rows.length === 0 ? (
        <EmptyState
          title={t("common.empty")}
          icon={<SlidersHorizontal className="size-5" aria-hidden />}
        />
      ) : (
        VIP_LEVELS.map((level, index) => (
          <VipConfigRow
            key={level}
            level={level}
            index={index}
            config={rows.find((row) => row.level === level)}
          />
        ))
      )}
    </div>
  );
}
