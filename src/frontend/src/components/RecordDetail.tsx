import type { TaskRecordView } from "@/backend";
import { StatusPill } from "@/components/ui-bits";
import { formatDateTime, formatFcfa, recordStatusKey } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { ImageOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

function DetailRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "commission";
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={
          tone === "commission"
            ? "min-w-0 break-words text-right font-display text-sm font-bold text-destructive"
            : "min-w-0 break-words text-right font-display text-sm font-bold text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function RecordDetail({
  record,
  onClose,
}: {
  record: TaskRecordView;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hasThumbnail = record.thumbnailUrl.trim().length > 0 && !imageFailed;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      data-ocid="records.detail_modal"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        aria-label={t("common.close")}
        data-ocid="records.detail_backdrop"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-secondary/60 backdrop-blur-sm"
      />

      <dialog
        ref={dialogRef}
        aria-modal="true"
        aria-label={t("records.detailTitle")}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        className="relative z-10 m-0 flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card p-0 shadow-card sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">
            {t("records.detailTitle")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            data-ocid="records.detail_close_button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground transition-smooth hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl bg-muted">
            {hasThumbnail ? (
              <img
                src={record.thumbnailUrl}
                alt={record.productDescription}
                onError={() => setImageFailed(true)}
                className="size-full object-cover"
              />
            ) : (
              <ImageOff className="size-7 text-muted-foreground" aria-hidden />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="min-w-0 flex-1 font-display text-lg font-bold text-foreground">
              {record.merchant}
            </p>
            <StatusPill
              label={t(recordStatusKey(record.status))}
              tone={statusTone(record.status)}
            />
          </div>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {record.productDescription}
          </p>

          <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-1">
            <DetailRow label={t("records.merchant")} value={record.merchant} />
            <DetailRow
              label={t("records.product")}
              value={record.productDescription}
            />
            <DetailRow
              label={t("records.createdAt")}
              value={formatDateTime(record.createdAt)}
            />
            <DetailRow
              label={t("records.status")}
              value={t(recordStatusKey(record.status))}
            />
            <DetailRow
              label={t("records.totalValue")}
              value={formatFcfa(record.totalValue)}
            />
            <DetailRow
              label={t("records.commission")}
              value={formatFcfa(record.commission)}
              tone="commission"
            />
          </div>
        </div>
      </dialog>
    </div>
  );
}
