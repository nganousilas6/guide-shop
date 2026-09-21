import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Inbox,
  Loader2,
  RefreshCw,
  Video,
  X,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Page container                                                      */
/* ------------------------------------------------------------------ */

export function PageContainer({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-md px-4 pb-8 pt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading — centered title between thin rules                 */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-4", className)}>
      <span className="h-px flex-1 bg-border" />
      <h2 className="font-display text-base font-bold tracking-tight text-foreground">
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surface card                                                        */
/* ------------------------------------------------------------------ */

export function SurfaceCard({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Primary CTA                                                         */
/* ------------------------------------------------------------------ */

export function PrimaryCta({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground shadow-cta transition-smooth hover:bg-primary/90 active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function DarkButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-12 w-full rounded-full bg-secondary text-base font-bold text-secondary-foreground transition-smooth hover:bg-secondary/90 active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Stat grid                                                           */
/* ------------------------------------------------------------------ */

export type StatCell = {
  label: string;
  value: string;
  tone?: "default" | "commission";
};

export function StatGrid({ stats }: { stats: StatCell[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-stat">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center justify-center gap-1 bg-stat px-3 py-4 text-center"
        >
          <span
            className={cn(
              "font-display text-lg font-bold leading-tight",
              stat.tone === "commission"
                ? "text-destructive"
                : "text-stat-foreground",
            )}
          >
            {stat.value}
          </span>
          <span className="text-[11px] leading-snug text-stat-muted">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function LoadingState({ label }: { label: string }) {
  return (
    <div
      data-ocid="loading_state"
      className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground"
    >
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  const ids = Array.from({ length: rows }, (_, index) => `skeleton-${index}`);
  return (
    <div data-ocid="loading_state" className="space-y-3">
      {ids.map((id) => (
        <div
          key={id}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <Skeleton className="size-14 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      data-ocid="empty_state"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-xs">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </span>
      <p className="font-display text-base font-bold text-foreground">
        {title}
      </p>
      {hint ? (
        <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry?: () => void;
  retryLabel: string;
}) {
  return (
    <div
      data-ocid="error_state"
      className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center"
    >
      <AlertCircle className="size-6 text-destructive" aria-hidden />
      <p className="text-sm text-foreground">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="rounded-full"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status pill                                                         */
/* ------------------------------------------------------------------ */

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Field                                                               */
/* ------------------------------------------------------------------ */

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p data-ocid="error_state" className="text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation dialog                                                 */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  pending = false,
  destructive = false,
  ocid = "confirm_dialog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  destructive?: boolean;
  ocid?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid={ocid} className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid={`${ocid}.cancel_button`}
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="rounded-full"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            data-ocid={`${ocid}.confirm_button`}
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "rounded-full font-bold",
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Attachment chip                                                     */
/* ------------------------------------------------------------------ */

export type AttachmentChipKind = "image" | "video" | "file";

export function AttachmentChip({
  name,
  kind,
  sizeLabel,
  progress,
  onRemove,
  removeLabel,
  className,
}: {
  name: string;
  kind: AttachmentChipKind;
  sizeLabel?: string;
  /** 0–100 while uploading; omit when the upload is complete. */
  progress?: number;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}) {
  const Icon =
    kind === "image" ? ImageIcon : kind === "video" ? Video : FileText;
  const isUploading = typeof progress === "number" && progress < 100;

  return (
    <div
      data-ocid="attachment_chip"
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-2.5 py-2",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-xs"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">{name}</p>
        {isUploading ? (
          <div className="mt-1 flex items-center gap-2">
            <progress
              data-ocid="attachment_chip.progress"
              value={Math.round(progress)}
              max={100}
              aria-label={name}
              className="h-1 flex-1 overflow-hidden rounded-full bg-border [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary"
            />
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
        ) : sizeLabel ? (
          <p className="text-[10px] text-muted-foreground">{sizeLabel}</p>
        ) : null}
      </div>
      {onRemove ? (
        <button
          type="button"
          data-ocid="attachment_chip.remove_button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
