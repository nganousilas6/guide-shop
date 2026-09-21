import { RecordStatus, VipLevel, WithdrawalStatus } from "@/backend";
import {
  formatAmount,
  formatCommissionRate,
  formatCount,
  formatDate,
  formatDateTime,
  formatFcfa,
  parseAmountInput,
  recordStatusKey,
  timestampToDate,
  vipLabel,
  withdrawalStatusKey,
} from "@/lib/format";
import { describe, expect, it } from "vitest";

/**
 * Characterization of the pure formatting/parsing helpers the whole UI depends
 * on. These are stable, cheap invariants: FCFA amounts are whole integers, and
 * the status/label mappers feed every badge and tab in the app.
 */
describe("format helpers", () => {
  it("formats whole FCFA amounts with a thousands separator", () => {
    expect(formatAmount(0n)).toBe("0");
    expect(formatAmount(500n)).toBe("500");
    // `fr-FR` groups with a narrow no-break space (U+202F), not a plain space.
    expect(formatAmount(12_000n)).toBe("12\u202f000");
    expect(formatFcfa(12_000n)).toBe("12\u202f000 FCFA");
    expect(formatCommissionRate(800n)).toBe("800 FCFA");
  });

  it("formats counts as plain decimal strings", () => {
    expect(formatCount(0n)).toBe("0");
    expect(formatCount(30n)).toBe("30");
  });

  it("parses whole-FCFA input and rejects decimals or junk", () => {
    expect(parseAmountInput("5000")).toBe(5_000n);
    expect(parseAmountInput(" 5 000 ")).toBe(5_000n);
    expect(parseAmountInput("0")).toBe(0n);
    expect(parseAmountInput("12.5")).toBeNull();
    expect(parseAmountInput("abc")).toBeNull();
    expect(parseAmountInput("")).toBeNull();
    expect(parseAmountInput("-100")).toBeNull();
  });

  it("converts nanosecond timestamps to dates and renders them", () => {
    // 2023-11-14T22:13:20Z
    const timestamp = 1_700_000_000_000_000_000n;
    expect(timestampToDate(timestamp)).toBeInstanceOf(Date);
    expect(formatDateTime(timestamp)).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
    );
    expect(formatDate(timestamp)).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  it("maps withdrawal and record statuses to translation keys", () => {
    expect(withdrawalStatusKey(WithdrawalStatus.pending)).toBe(
      "status.pending",
    );
    expect(withdrawalStatusKey(WithdrawalStatus.approved)).toBe(
      "status.approved",
    );
    expect(withdrawalStatusKey(WithdrawalStatus.rejected)).toBe(
      "status.rejected",
    );
    expect(recordStatusKey(RecordStatus.termine)).toBe("status.completed");
    expect(recordStatusKey(RecordStatus.frozen)).toBe("status.frozen");
    expect(recordStatusKey(RecordStatus.soumission)).toBe("status.submitted");
  });

  it("uppercases VIP level labels", () => {
    expect(vipLabel(VipLevel.vip0)).toBe("VIP0");
    expect(vipLabel(VipLevel.vip3)).toBe("VIP3");
  });
});
