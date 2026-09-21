import {
  useAddMoney,
  useApproveWithdrawal,
  useAssignTaskToUser,
  useLogin,
  useRegister,
  useReplyToUser,
  useRequestWithdrawal,
  useSendMessage,
  useSetVipConfig,
  useSetVipLevel,
  useStartTask,
} from "@/lib/api";
import { resetCoreMock, setMockActor } from "@/test/core-mock";
import {
  VipLevelEnum,
  createMockActor,
  createTestQueryClient,
  makeAccount,
  makeAdminRow,
  makeMessage,
  makeRecord,
  makeSession,
  makeWithdrawal,
} from "@/test/harness";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@caffeineai/core-infrastructure", async () => {
  const { coreInfrastructureMock } = await import("@/test/core-mock");
  return coreInfrastructureMock();
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  resetCoreMock();
});

describe("api consumer contract", () => {
  it("register forwards phone, password, promo code and secondary password", async () => {
    const actor = createMockActor({
      register: vi.fn().mockResolvedValue(makeAccount()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useRegister(), { wrapper });

    result.current.mutate({
      phone: "+2250700000001",
      password: "secret123",
      promoCode: "VIP1PROMO",
      secondaryPassword: "withdraw1",
    });

    await waitFor(() => {
      expect(actor.register).toHaveBeenCalledWith(
        "+2250700000001",
        "secret123",
        "VIP1PROMO",
        "withdraw1",
      );
    });
  });

  it("login forwards phone and password", async () => {
    const actor = createMockActor({
      login: vi.fn().mockResolvedValue(makeSession()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ phone: "+2250700000001", password: "secret123" });

    await waitFor(() => {
      expect(actor.login).toHaveBeenCalledWith("+2250700000001", "secret123");
    });
  });

  it("requestWithdrawal forwards the amount as bigint and the secondary password", async () => {
    const actor = createMockActor({
      requestWithdrawal: vi.fn().mockResolvedValue(makeWithdrawal()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useRequestWithdrawal(), { wrapper });

    result.current.mutate({ amount: 5_000n, secondaryPassword: "withdraw1" });

    await waitFor(() => {
      expect(actor.requestWithdrawal).toHaveBeenCalledWith(5_000n, "withdraw1");
    });
  });

  it("startTask calls the backend with no arguments", async () => {
    const actor = createMockActor({
      startTask: vi.fn().mockResolvedValue(makeRecord()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useStartTask(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(actor.startTask).toHaveBeenCalledWith();
    });
  });

  it("sendMessage forwards the message body", async () => {
    const actor = createMockActor({
      sendMessage: vi.fn().mockResolvedValue(makeMessage()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    result.current.mutate("Bonjour");

    await waitFor(() => {
      expect(actor.sendMessage).toHaveBeenCalledWith("Bonjour", null);
    });
  });

  it("addMoney forwards the user id and amount", async () => {
    const actor = createMockActor({
      addMoney: vi.fn().mockResolvedValue(makeAdminRow()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useAddMoney(), { wrapper });

    result.current.mutate({ userId: 7n, amount: 5_000n });

    await waitFor(() => {
      expect(actor.addMoney).toHaveBeenCalledWith(7n, 5_000n);
    });
  });

  it("setVipLevel forwards the user id and level", async () => {
    const actor = createMockActor({
      setVipLevel: vi.fn().mockResolvedValue(makeAdminRow()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useSetVipLevel(), { wrapper });

    result.current.mutate({ userId: 7n, level: VipLevelEnum.vip1 });

    await waitFor(() => {
      expect(actor.setVipLevel).toHaveBeenCalledWith(7n, "vip1");
    });
  });

  it("setVipConfig forwards the level, quota and rate", async () => {
    const actor = createMockActor({
      setVipConfig: vi.fn().mockResolvedValue({
        level: VipLevelEnum.vip1,
        dailyTaskQuota: 5n,
        commissionRate: 800n,
      }),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useSetVipConfig(), { wrapper });

    result.current.mutate({
      level: VipLevelEnum.vip1,
      dailyTaskQuota: 5n,
      commissionRate: 800n,
    });

    await waitFor(() => {
      expect(actor.setVipConfig).toHaveBeenCalledWith("vip1", 5n, 800n);
    });
  });

  it("assignTaskToUser forwards the target and task fields", async () => {
    const actor = createMockActor({
      assignTaskToUser: vi.fn().mockResolvedValue(makeRecord()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useAssignTaskToUser(), { wrapper });

    result.current.mutate({
      userId: 7n,
      merchant: "Marchand",
      productDescription: "Produit",
      thumbnailUrl: "",
      totalValue: 5_000n,
    });

    await waitFor(() => {
      expect(actor.assignTaskToUser).toHaveBeenCalledWith(
        7n,
        "Marchand",
        "Produit",
        "",
        5_000n,
      );
    });
  });

  it("approveWithdrawal forwards the request id", async () => {
    const actor = createMockActor({
      approveWithdrawal: vi.fn().mockResolvedValue(makeWithdrawal()),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useApproveWithdrawal(), { wrapper });

    result.current.mutate(42n);

    await waitFor(() => {
      expect(actor.approveWithdrawal).toHaveBeenCalledWith(42n);
    });
  });

  it("replyToUser forwards the user id and body", async () => {
    const actor = createMockActor({
      replyToUser: vi.fn().mockResolvedValue(makeMessage({ fromAdmin: true })),
    });
    setMockActor(actor);
    const { result } = renderHook(() => useReplyToUser(), { wrapper });

    result.current.mutate({ userId: 5n, body: "Bonjour" });

    await waitFor(() => {
      expect(actor.replyToUser).toHaveBeenCalledWith(5n, "Bonjour", null);
    });
  });
});
