import type { TaskRecordView } from "@/backend";
import { StatusPill } from "@/components/ui-bits";
import { formatDateTime, formatFcfa, recordStatusKey } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChevronRight, ImageOff } from "lucide-react";
import { useState } from "react";

function statusTone(
  status: TaskRecordView["status"],
): "neutral" | "success" | "danger" | "warning" {
  switch (status) {
    case "termine":
      return "success";
    case "frozen":
      return "danger";
    default:
      return "warning";
  }
}

export function RecordCard({
  record,
  index,
  onOpen,
}: {
  record: TaskRecordView;
  index: number;
  onOpen: (record: TaskRecordView) => void;
}) {
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);
  const hasThumbnail = record.thumbnailUrl.trim().length > 0 && !imageFailed;

  return (
    <button
      type="button"
      data-ocid={`records.item.${index + 1}`}
      onClick={() => onOpen(record)}
      className="group flex w-full items-stretch gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-card transition-smooth hover:border-primary/40 hover:shadow-cta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.995]"
    >
      <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
        {hasThumbnail ? (
          <img
            src={record.thumbnailUrl}
            alt={record.productDescription}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <ImageOff className="size-5 text-muted-foreground" aria-hidden />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-sm font-bold text-foreground">
              {record.merchant}
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
              {formatDateTime(record.createdAt)}
            </span>
          </span>
          <StatusPill
            label={t(recordStatusKey(record.status))}
            tone={statusTone(record.status)}
          />
        </span>

        <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {record.productDescription}
        </span>

        <span className="mt-auto flex items-end justify-between gap-2 pt-1">
          <span className="flex min-w-0 flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("records.totalValue")}
            </span>
            <span className="truncate font-display text-sm font-bold text-foreground">
              {formatFcfa(record.totalValue)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <span className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("records.commission")}
              </span>
              <span
                className={cn(
                  "font-display text-sm font-bold text-destructive",
                )}
              >
                {formatFcfa(record.commission)}
              </span>
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-smooth group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </span>
        </span>
      </span>
    </button>
  );
}
