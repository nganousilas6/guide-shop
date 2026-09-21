import type {
  AttachmentKind,
  RecordStatus,
  ServiceStatus,
  VipLevel,
  WithdrawalStatus,
} from "@/backend";
import type { TranslationKey } from "@/lib/i18n";

/** Minimum withdrawal amount enforced by the platform, in whole FCFA. */
export const MIN_WITHDRAWAL_AMOUNT = 2_000n;

/** Maximum size for a chat attachment, in bytes (25 MB). */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** Motoko `Time.now()` values are nanosecond bigints. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** Amounts are whole FCFA integers (no decimals) — see types/common.mo. */
export function formatAmount(amount: bigint): string {
  return Number(amount).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  });
}

export function formatFcfa(amount: bigint): string {
  return `${formatAmount(amount)} FCFA`;
}

export function formatCount(value: bigint): string {
  return value.toString();
}

/** Parse a whole-FCFA amount; decimals are not accepted. */
export function parseAmountInput(input: string): bigint | null {
  const normalized = input.replace(/\s/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  return BigInt(normalized);
}

/** Commission rates are whole FCFA per task (e.g. 500 means 500 FCFA). */
export function formatCommissionRate(rate: bigint): string {
  return `${formatAmount(rate)} FCFA`;
}

export function vipLabel(level: VipLevel): string {
  return level.toUpperCase();
}

export function withdrawalStatusKey(status: WithdrawalStatus): string {
  switch (status) {
    case "approved":
      return "status.approved";
    case "rejected":
      return "status.rejected";
    default:
      return "status.pending";
  }
}

export function recordStatusKey(status: RecordStatus): TranslationKey {
  switch (status) {
    case "termine":
      return "status.completed";
    case "frozen":
      return "status.frozen";
    default:
      return "status.submitted";
  }
}

/* ------------------------------------------------------------------ */
/* Service hours                                                       */
/* ------------------------------------------------------------------ */

/** Render an hour-of-day bigint as a zero-padded `HH:00` label. */
export function formatHour(hour: bigint): string {
  return `${String(Number(hour)).padStart(2, "0")}:00`;
}

/**
 * The service desk is open daily from `opensAtHour` to `closesAtHour`.
 * The backend reports the authoritative state; this is the fallback used
 * before the first response arrives.
 */
export function isServiceOpen(status: ServiceStatus | null): boolean {
  if (!status) return false;
  return status.isOpen;
}

/** Translation key for the open/closed badge. */
export function serviceStatusKey(status: ServiceStatus | null): TranslationKey {
  return isServiceOpen(status) ? "service.open" : "service.closed";
}

/* ------------------------------------------------------------------ */
/* Attachments                                                         */
/* ------------------------------------------------------------------ */

/** Detect an image from the stored filename (never from the proxy URL). */
export function isImageFilename(filename: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filename);
}

/** Detect a video from the stored filename (never from the proxy URL). */
export function isVideoFilename(filename: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogv|avi|mkv)$/i.test(filename);
}

/** Translation key for an attachment kind badge. */
export function attachmentKindKey(kind: AttachmentKind): TranslationKey {
  switch (kind) {
    case "image":
      return "service.attachmentPhoto";
    case "video":
      return "service.attachmentVideo";
    default:
      return "service.attachmentFile";
  }
}

/** Human-readable file size, e.g. `1,2 Mo`. */
export function formatFileSize(bytes: bigint): string {
  const value = Number(bytes);
  if (value < 1024) return `${value} o`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} Ko`;
  return `${(value / (1024 * 1024)).toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  })} Mo`;
}
