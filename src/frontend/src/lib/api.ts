import { SecondaryPasswordError, createActor } from "@/backend";
import type {
  AccountView,
  AdminAccountRow,
  Attachment,
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
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Default page size for every bounded list query. */
export const PAGE_SIZE = 50n;

export const queryKeys = {
  session: ["session"] as const,
  account: ["account"] as const,
  dailyProgress: ["dailyProgress"] as const,
  serviceStatus: ["serviceStatus"] as const,
  records: (status: RecordStatus | null) => ["records", status] as const,
  record: (id: bigint) => ["record", id.toString()] as const,
  commissions: ["commissions"] as const,
  vipConfigs: ["vipConfigs"] as const,
  myWithdrawals: ["myWithdrawals"] as const,
  myMessages: ["myMessages"] as const,
  accounts: ["accounts"] as const,
  pendingWithdrawals: ["pendingWithdrawals"] as const,
  conversations: ["conversations"] as const,
  conversation: (userId: bigint) =>
    ["conversation", userId.toString()] as const,
};

export function useBackendActor() {
  return useActor(createActor);
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export function useRegister() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (input: {
      phone: string;
      password: string;
      promoCode: string;
      secondaryPassword: string;
    }): Promise<AccountView> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.register(
        input.phone,
        input.password,
        input.promoCode,
        input.secondaryPassword,
      );
    },
  });
}

export function useLogin() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (input: {
      phone: string;
      password: string;
    }): Promise<SessionView> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.login(input.phone, input.password);
    },
  });
}

export function useAdminLogin() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (input: {
      username: string;
      password: string;
    }): Promise<SessionView> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminLogin(input.username, input.password);
    },
  });
}

/* ------------------------------------------------------------------ */
/* User queries                                                        */
/* ------------------------------------------------------------------ */

export function useMyAccount(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.account,
    queryFn: async (): Promise<AccountView | null> => {
      if (!actor) return null;
      return actor.getMyAccount();
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useDailyProgress(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.dailyProgress,
    queryFn: async (): Promise<DailyProgress | null> => {
      if (!actor) return null;
      return actor.getDailyProgress();
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useServiceStatus(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.serviceStatus,
    queryFn: async (): Promise<ServiceStatus | null> => {
      if (!actor) return null;
      return actor.getServiceStatus();
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useRecords(status: RecordStatus | null, enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.records(status),
    queryFn: async (): Promise<TaskRecordView[]> => {
      if (!actor) return [];
      return actor.listRecords(status, PAGE_SIZE, null);
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useRecord(recordId: bigint | null, enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.record(recordId ?? 0n),
    queryFn: async (): Promise<TaskRecordView | null> => {
      if (!actor || recordId === null) return null;
      return actor.getRecord(recordId);
    },
    enabled: enabled && !!actor && !isFetching && recordId !== null,
  });
}

export function useCommissions(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.commissions,
    queryFn: async (): Promise<CommissionEntry[]> => {
      if (!actor) return [];
      return actor.listCommissions(PAGE_SIZE, null);
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useVipConfigs(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.vipConfigs,
    queryFn: async (): Promise<VipConfig[]> => {
      if (!actor) return [];
      return actor.listVipConfigs();
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useMyWithdrawals(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.myWithdrawals,
    queryFn: async (): Promise<WithdrawalView[]> => {
      if (!actor) return [];
      return actor.listMyWithdrawals(PAGE_SIZE, null);
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useMyMessages(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.myMessages,
    queryFn: async (): Promise<ChatMessageView[]> => {
      if (!actor) return [];
      return actor.listMyMessages(PAGE_SIZE, null);
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* User mutations                                                      */
/* ------------------------------------------------------------------ */

export function useStartTask() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<TaskRecordView> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.startTask();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dailyProgress });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account });
      void queryClient.invalidateQueries({ queryKey: ["records"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
    },
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      amount: bigint;
      secondaryPassword: string;
    }): Promise<WithdrawalView> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.requestWithdrawal(input.amount, input.secondaryPassword);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myWithdrawals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dailyProgress });
    },
  });
}

export function useChangeSecondaryPassword() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (input: { oldPassword: string; newPassword: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.changeSecondaryPassword(
        input.oldPassword,
        input.newPassword,
      );
      if (result !== SecondaryPasswordError.ok) {
        throw new Error(String(result));
      }
      return result;
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: string | { body: string; attachment?: Attachment | null },
    ): Promise<ChatMessageView> => {
      if (!actor) throw new Error("Backend is not ready");
      const body = typeof input === "string" ? input : input.body;
      const attachment =
        typeof input === "string" ? null : (input.attachment ?? null);
      return actor.sendMessage(body, attachment);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myMessages });
    },
  });
}

export function useTouchSession() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (): Promise<AccountView | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.touchSession();
    },
  });
}

/* ------------------------------------------------------------------ */
/* Admin queries                                                       */
/* ------------------------------------------------------------------ */

export function useAccounts(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async (): Promise<AdminAccountRow[]> => {
      if (!actor) return [];
      return actor.listAccounts(PAGE_SIZE, null);
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function usePendingWithdrawals(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.pendingWithdrawals,
    queryFn: async (): Promise<WithdrawalView[]> => {
      if (!actor) return [];
      return actor.listPendingWithdrawals(PAGE_SIZE, null);
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useConversations(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async (): Promise<ConversationSummary[]> => {
      if (!actor) return [];
      return actor.listConversations(PAGE_SIZE, null);
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useConversationMessages(
  userId: bigint | null,
  enabled: boolean,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.conversation(userId ?? 0n),
    queryFn: async (): Promise<ChatMessageView[]> => {
      if (!actor || userId === null) return [];
      return actor.listConversationMessages(userId, PAGE_SIZE, null);
    },
    enabled: enabled && !!actor && !isFetching && userId !== null,
  });
}

/* ------------------------------------------------------------------ */
/* Admin mutations                                                     */
/* ------------------------------------------------------------------ */

export function useAddMoney() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addMoney(input.userId, input.amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

export function useRemoveMoney() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeMoney(input.userId, input.amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

export function useGrantCommission() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.grantCommission(input.userId, input.amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

export function useSetVipLevel() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; level: VipLevel }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setVipLevel(input.userId, input.level);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

export function useSetVipConfig() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      level: VipLevel;
      dailyTaskQuota: bigint;
      commissionRate: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setVipConfig(
        input.level,
        input.dailyTaskQuota,
        input.commissionRate,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vipConfigs });
    },
  });
}

export function useAssignTaskToUser() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: bigint;
      merchant: string;
      productDescription: string;
      thumbnailUrl: string;
      totalValue: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.assignTaskToUser(
        input.userId,
        input.merchant,
        input.productDescription,
        input.thumbnailUrl,
        input.totalValue,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

export function useAssignTaskToVip() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      level: VipLevel;
      merchant: string;
      productDescription: string;
      thumbnailUrl: string;
      totalValue: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.assignTaskToVip(
        input.level,
        input.merchant,
        input.productDescription,
        input.thumbnailUrl,
        input.totalValue,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

export function useApproveWithdrawal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.approveWithdrawal(requestId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pendingWithdrawals,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

export function useRejectWithdrawal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.rejectWithdrawal(requestId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pendingWithdrawals,
      });
    },
  });
}

export function useReplyToUser() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: bigint;
      body: string;
      attachment?: Attachment | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.replyToUser(
        input.userId,
        input.body,
        input.attachment ?? null,
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(variables.userId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Admin recharge / account-control mutations                          */
/* ------------------------------------------------------------------ */

/** Admin sets the recharge amount requested from a user. */
export function useSetRechargeRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setRechargeRequest(input.userId, input.amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

/**
 * Admin clears the pending recharge request without touching the balance.
 * The backend stores the request as a plain amount, so a zero amount is the
 * canonical "no request" state.
 */
export function useClearRechargeRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setRechargeRequest(input.userId, 0n);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

/** Admin credits a recharge, increasing the user's available balance. */
export function useCreditRecharge() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.creditRecharge(input.userId, input.amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

/** Admin sets the refund amount promised to a user. */
export function useSetPendingRefund() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setPendingRefund(input.userId, input.amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

/** Admin blocks or unblocks an account. */
export function useSetAccountBlocked() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; blocked: boolean }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setAccountBlocked(input.userId, input.blocked);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

/** Admin changes any account's secondary withdrawal password. */
export function useSetSecondaryPassword() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: bigint; newPassword: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setSecondaryPassword(input.userId, input.newPassword);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

/** Admin deletes a user's entire chat thread from the Service inbox. */
export function useClearConversation() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.clearConversation(userId);
    },
    onSuccess: (_data, userId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(userId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}
