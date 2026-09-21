import type {
  AccountView,
  AdminAccountRow,
  ChatMessageView,
  CommissionEntry,
  ConversationSummary,
  DailyProgress,
  RecordStatus,
  ServiceStatus,
  SessionView,
  TaskRecordView,
  VipConfig,
  VipLevel,
  WithdrawalView,
} from "@/backend";
import {
  RecordStatus as RecordStatusEnum,
  SecondaryPasswordError,
  VipLevel as VipLevelEnum,
  WithdrawalStatus,
} from "@/backend";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

/**
 * A typed, in-memory stand-in for the generated backend actor. Every method the
 * frontend calls is present so a missing one is a type error rather than a
 * runtime trap. Tests override individual methods with `vi.fn()` as needed.
 *
 * This is a local mock: it proves the frontend's consumer contract and UI
 * behavior, never the real canister.
 */
export type MockActor = {
  register: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  adminLogin: ReturnType<typeof vi.fn>;
  getMyAccount: ReturnType<typeof vi.fn>;
  getDailyProgress: ReturnType<typeof vi.fn>;
  getServiceStatus: ReturnType<typeof vi.fn>;
  listRecords: ReturnType<typeof vi.fn>;
  getRecord: ReturnType<typeof vi.fn>;
  listCommissions: ReturnType<typeof vi.fn>;
  listVipConfigs: ReturnType<typeof vi.fn>;
  listMyWithdrawals: ReturnType<typeof vi.fn>;
  listMyMessages: ReturnType<typeof vi.fn>;
  startTask: ReturnType<typeof vi.fn>;
  requestWithdrawal: ReturnType<typeof vi.fn>;
  changeSecondaryPassword: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  touchSession: ReturnType<typeof vi.fn>;
  listAccounts: ReturnType<typeof vi.fn>;
  listPendingWithdrawals: ReturnType<typeof vi.fn>;
  listConversations: ReturnType<typeof vi.fn>;
  listConversationMessages: ReturnType<typeof vi.fn>;
  addMoney: ReturnType<typeof vi.fn>;
  removeMoney: ReturnType<typeof vi.fn>;
  grantCommission: ReturnType<typeof vi.fn>;
  setVipLevel: ReturnType<typeof vi.fn>;
  setVipConfig: ReturnType<typeof vi.fn>;
  assignTaskToUser: ReturnType<typeof vi.fn>;
  assignTaskToVip: ReturnType<typeof vi.fn>;
  approveWithdrawal: ReturnType<typeof vi.fn>;
  rejectWithdrawal: ReturnType<typeof vi.fn>;
  replyToUser: ReturnType<typeof vi.fn>;
  setRechargeRequest: ReturnType<typeof vi.fn>;
  creditRecharge: ReturnType<typeof vi.fn>;
  setPendingRefund: ReturnType<typeof vi.fn>;
  setAccountBlocked: ReturnType<typeof vi.fn>;
  setSecondaryPassword: ReturnType<typeof vi.fn>;
  clearConversation: ReturnType<typeof vi.fn>;
};

export function createMockActor(overrides: Partial<MockActor> = {}): MockActor {
  const actor: MockActor = {
    register: vi.fn(),
    login: vi.fn(),
    adminLogin: vi.fn(),
    getMyAccount: vi.fn().mockResolvedValue(null),
    getDailyProgress: vi.fn(),
    getServiceStatus: vi.fn().mockResolvedValue(makeServiceStatus()),
    listRecords: vi.fn().mockResolvedValue([]),
    getRecord: vi.fn().mockResolvedValue(null),
    listCommissions: vi.fn().mockResolvedValue([]),
    listVipConfigs: vi.fn().mockResolvedValue([]),
    listMyWithdrawals: vi.fn().mockResolvedValue([]),
    listMyMessages: vi.fn().mockResolvedValue([]),
    startTask: vi.fn(),
    requestWithdrawal: vi.fn(),
    changeSecondaryPassword: vi.fn(),
    sendMessage: vi.fn(),
    touchSession: vi.fn().mockResolvedValue(null),
    listAccounts: vi.fn().mockResolvedValue([]),
    listPendingWithdrawals: vi.fn().mockResolvedValue([]),
    listConversations: vi.fn().mockResolvedValue([]),
    listConversationMessages: vi.fn().mockResolvedValue([]),
    addMoney: vi.fn(),
    removeMoney: vi.fn(),
    grantCommission: vi.fn(),
    setVipLevel: vi.fn(),
    setVipConfig: vi.fn(),
    assignTaskToUser: vi.fn(),
    assignTaskToVip: vi.fn(),
    approveWithdrawal: vi.fn(),
    rejectWithdrawal: vi.fn(),
    replyToUser: vi.fn(),
    setRechargeRequest: vi.fn(),
    creditRecharge: vi.fn(),
    setPendingRefund: vi.fn(),
    setAccountBlocked: vi.fn(),
    setSecondaryPassword: vi.fn(),
    clearConversation: vi.fn(),
    ...overrides,
  };
  return actor;
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

export function makeAccount(overrides: Partial<AccountView> = {}): AccountView {
  return {
    id: 1n,
    balance: 0n,
    vipLevel: VipLevelEnum.vip0,
    blocked: false,
    createdAt: 1_700_000_000_000_000_000n,
    isOnline: true,
    promoCode: "VIP1PROMO",
    creditScore: 100n,
    phone: "+2250700000001",
    ...overrides,
  };
}

export function makeSession(overrides: Partial<SessionView> = {}): SessionView {
  return {
    account: makeAccount(),
    isAdmin: false,
    ...overrides,
  };
}

export function makeProgress(
  overrides: Partial<DailyProgress> = {},
): DailyProgress {
  return {
    insufficientBalance: false,
    availableBalance: 0n,
    completedToday: 0n,
    vipLevel: VipLevelEnum.vip0,
    blocked: false,
    commissionEarned: 0n,
    canStartTask: true,
    commissionRate: 500n,
    pendingRefund: 0n,
    dailyTaskQuota: 3n,
    ...overrides,
  };
}

export function makeRecord(
  overrides: Partial<TaskRecordView> = {},
): TaskRecordView {
  return {
    id: 1n,
    status: RecordStatusEnum.termine,
    thumbnailUrl: "",
    totalValue: 5000n,
    userId: 1n,
    createdAt: 1_700_000_000_000_000_000n,
    commission: 500n,
    merchant: "Marchand Test",
    productDescription: "Produit de test",
    ...overrides,
  };
}

export function makeCommission(
  overrides: Partial<CommissionEntry> = {},
): CommissionEntry {
  return {
    id: 1n,
    source: "Tache journaliere",
    userId: 1n,
    createdAt: 1_700_000_000_000_000_000n,
    amount: 500n,
    ...overrides,
  };
}

export function makeWithdrawal(
  overrides: Partial<WithdrawalView> = {},
): WithdrawalView {
  return {
    id: 1n,
    status: WithdrawalStatus.pending,
    userId: 1n,
    createdAt: 1_700_000_000_000_000_000n,
    amount: 5000n,
    ...overrides,
  };
}

export function makeAdminRow(
  overrides: Partial<AdminAccountRow> = {},
): AdminAccountRow {
  return {
    id: 1n,
    balance: 0n,
    vipLevel: VipLevelEnum.vip0,
    blocked: false,
    password: "secret123",
    isOnline: true,
    secondaryPassword: "withdraw1",
    phone: "+2250700000001",
    pendingRefund: 0n,
    ...overrides,
  };
}

export function makeVipConfig(overrides: Partial<VipConfig> = {}): VipConfig {
  return {
    level: VipLevelEnum.vip0,
    commissionRate: 500n,
    dailyTaskQuota: 3n,
    ...overrides,
  };
}

export function makeServiceStatus(
  overrides: Partial<ServiceStatus> = {},
): ServiceStatus {
  return {
    closesAtHour: 18n,
    isOpen: true,
    opensAtHour: 8n,
    ...overrides,
  };
}

export function makeMessage(
  overrides: Partial<ChatMessageView> = {},
): ChatMessageView {
  return {
    id: 1n,
    body: "Bonjour",
    userId: 1n,
    createdAt: 1_700_000_000_000_000_000n,
    fromAdmin: false,
    ...overrides,
  };
}

export function makeConversation(
  overrides: Partial<ConversationSummary> = {},
): ConversationSummary {
  return {
    lastMessageAt: 1_700_000_000_000_000_000n,
    userId: 1n,
    lastMessage: "Bonjour",
    unreadCount: 1n,
    phone: "+2250700000001",
    ...overrides,
  };
}

export {
  RecordStatusEnum,
  SecondaryPasswordError,
  VipLevelEnum,
  WithdrawalStatus,
};

/* ------------------------------------------------------------------ */
/* Render helper                                                       */
/* ------------------------------------------------------------------ */

/**
 * Seed the persisted auth session so `AuthProvider` starts authenticated.
 *
 * `AuthProvider` only clears the session when there is no identity, so a
 * seeded session survives the `touchSession()` refresh even when the mock
 * resolves `null`. Pair this with `setIdentity(...)`.
 */
export function seedSession(
  account: AccountView = makeAccount(),
  isAdmin = false,
): void {
  window.localStorage.setItem(
    "fobshop.session",
    JSON.stringify({ account, isAdmin }),
  );
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options: {
    queryClient?: QueryClient;
    withAuth?: boolean;
  } & Omit<RenderOptions, "wrapper"> = {},
) {
  const {
    queryClient = createTestQueryClient(),
    withAuth = true,
    ...renderOptions
  } = options;
  function Wrapper({ children }: { children: ReactNode }) {
    const inner = withAuth ? <AuthProvider>{children}</AuthProvider> : children;
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>{inner}</I18nProvider>
      </QueryClientProvider>
    );
  }
  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
