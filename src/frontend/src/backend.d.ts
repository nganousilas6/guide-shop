import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface AccountView {
    id: UserId;
    balance: Amount;
    vipLevel: VipLevel;
    blocked: boolean;
    createdAt: Timestamp;
    isOnline: boolean;
    promoCode: string;
    creditScore: bigint;
    phone: string;
}
export interface AdminAccountRow {
    id: UserId;
    balance: Amount;
    vipLevel: VipLevel;
    blocked: boolean;
    password: string;
    isOnline: boolean;
    secondaryPassword: string;
    phone: string;
    requestedRecharge?: Amount;
    pendingRefund: Amount;
}
export type Amount = bigint;
export interface Attachment {
    blob: ExternalBlob;
    kind: AttachmentKind;
    name: string;
    size: bigint;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface ChatMessageView {
    id: bigint;
    body: string;
    userId: UserId;
    createdAt: Timestamp;
    fromAdmin: boolean;
    attachment?: Attachment;
}
export interface CommissionEntry {
    id: bigint;
    source: string;
    userId: UserId;
    createdAt: Timestamp;
    amount: Amount;
}
export interface ConversationSummary {
    lastMessageAt: Timestamp;
    userId: UserId;
    lastMessage: string;
    unreadCount: bigint;
    phone: string;
}
export interface DailyProgress {
    insufficientBalance: boolean;
    availableBalance: Amount;
    completedToday: bigint;
    vipLevel: VipLevel;
    blocked: boolean;
    commissionEarned: Amount;
    canStartTask: boolean;
    commissionRate: bigint;
    requestedRecharge?: Amount;
    pendingRefund: Amount;
    dailyTaskQuota: bigint;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface ServiceStatus {
    closesAtHour: bigint;
    isOpen: boolean;
    opensAtHour: bigint;
}
export interface SessionView {
    account: AccountView;
    isAdmin: boolean;
}
export interface TaskRecordView {
    id: bigint;
    status: RecordStatus;
    thumbnailUrl: string;
    totalValue: Amount;
    userId: UserId;
    createdAt: Timestamp;
    commission: Amount;
    merchant: string;
    productDescription: string;
}
export type Timestamp = bigint;
export type UserId = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface VipConfig {
    level: VipLevel;
    commissionRate: bigint;
    dailyTaskQuota: bigint;
}
export interface WithdrawalView {
    id: bigint;
    status: WithdrawalStatus;
    userId: UserId;
    createdAt: Timestamp;
    reviewedAt?: Timestamp;
    amount: Amount;
}
export enum AttachmentKind {
    video = "video",
    file = "file",
    image = "image"
}
export enum RecordStatus {
    termine = "termine",
    soumission = "soumission",
    frozen = "frozen"
}
export enum SecondaryPasswordError {
    ok = "ok",
    wrongPassword = "wrongPassword",
    weakPassword = "weakPassword",
    notRegistered = "notRegistered"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VipLevel {
    vip0 = "vip0",
    vip1 = "vip1",
    vip2 = "vip2",
    vip3 = "vip3"
}
export enum WithdrawalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    /**
     * / Add money to an account balance.
     */
    addMoney(userId: UserId, amount: Amount): Promise<AdminAccountRow>;
    /**
     * / Sign in the fixed admin account with username and password.
     */
    adminLogin(username: string, password: string): Promise<SessionView>;
    /**
     * / Approve a withdrawal request, deducting the amount from the user's balance.
     */
    approveWithdrawal(requestId: bigint): Promise<WithdrawalView>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create and assign a daily task to an individual account.
     */
    assignTaskToUser(userId: UserId, merchant: string, productDescription: string, thumbnailUrl: string, totalValue: Amount): Promise<TaskRecordView>;
    /**
     * / Create and assign a daily task to every account at a VIP level.
     */
    assignTaskToVip(level: VipLevel, merchant: string, productDescription: string, thumbnailUrl: string, totalValue: Amount): Promise<Array<TaskRecordView>>;
    /**
     * / Change the caller's secondary withdrawal password.
     */
    changeSecondaryPassword(oldPassword: string, newPassword: string): Promise<SecondaryPasswordError>;
    /**
     * / Delete a user's entire chat thread from the Service inbox.
     */
    clearConversation(userId: UserId): Promise<void>;
    /**
     * / Credit a recharge to a user, increasing their available balance.
     */
    creditRecharge(userId: UserId, amount: Amount): Promise<AdminAccountRow>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Return the backend API documentation as Markdown.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Return the caller's daily task progress for the Demarrage tab.
     */
    getDailyProgress(): Promise<DailyProgress>;
    /**
     * / Return the signed-in caller's account view.
     */
    getMyAccount(): Promise<AccountView | null>;
    /**
     * / Fetch a single task record owned by the caller.
     */
    getRecord(recordId: bigint): Promise<TaskRecordView | null>;
    /**
     * / Report whether the service desk is currently open.
     */
    getServiceStatus(): Promise<ServiceStatus>;
    /**
     * / Grant commission to an account.
     */
    grantCommission(userId: UserId, amount: Amount): Promise<AdminAccountRow>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List every registered account for the admin dashboard.
     */
    listAccounts(limit: bigint, beforeId: bigint | null): Promise<Array<AdminAccountRow>>;
    /**
     * / List the caller's commission entries for the Accueil tab.
     */
    listCommissions(limit: bigint, beforeId: bigint | null): Promise<Array<CommissionEntry>>;
    /**
     * / Load a user's conversation history for the admin.
     */
    listConversationMessages(userId: UserId, limit: bigint, beforeId: bigint | null): Promise<Array<ChatMessageView>>;
    /**
     * / List all user conversations for the admin Service inbox.
     */
    listConversations(limit: bigint, beforeUserId: UserId | null): Promise<Array<ConversationSummary>>;
    /**
     * / Load the caller's conversation history, newest first.
     */
    listMyMessages(limit: bigint, beforeId: bigint | null): Promise<Array<ChatMessageView>>;
    /**
     * / List the caller's withdrawal requests with their statuses.
     */
    listMyWithdrawals(limit: bigint, beforeId: bigint | null): Promise<Array<WithdrawalView>>;
    /**
     * / List all pending withdrawal requests.
     */
    listPendingWithdrawals(limit: bigint, beforeId: bigint | null): Promise<Array<WithdrawalView>>;
    /**
     * / List the caller's task/order records, optionally filtered by status.
     */
    listRecords(status: RecordStatus | null, limit: bigint, beforeId: bigint | null): Promise<Array<TaskRecordView>>;
    /**
     * / Return the admin-configured settings for every VIP level.
     */
    listVipConfigs(): Promise<Array<VipConfig>>;
    /**
     * / Sign in with phone number and password.
     */
    login(phone: string, password: string): Promise<SessionView>;
    /**
     * / Register a new account at VIP0 with a required promo code.
     */
    register(phone: string, password: string, promoCode: string, secondaryPassword: string): Promise<AccountView>;
    /**
     * / Reject a withdrawal request.
     */
    rejectWithdrawal(requestId: bigint): Promise<WithdrawalView>;
    /**
     * / Remove money from an account balance.
     */
    removeMoney(userId: UserId, amount: Amount): Promise<AdminAccountRow>;
    /**
     * / Reply to a user's conversation from the admin console.
     */
    replyToUser(userId: UserId, body: string, attachment: Attachment | null): Promise<ChatMessageView>;
    /**
     * / Request a withdrawal, confirmed with the secondary password.
     */
    requestWithdrawal(amount: Amount, secondaryPassword: string): Promise<WithdrawalView>;
    schema(): Promise<string>;
    /**
     * / Send a customer-service message from the caller to the admin.
     */
    sendMessage(body: string, attachment: Attachment | null): Promise<ChatMessageView>;
    /**
     * / Block or unblock an account.
     */
    setAccountBlocked(userId: UserId, blocked: boolean): Promise<AdminAccountRow>;
    /**
     * / Set the refund amount promised to a user (Montant de remboursement en attente).
     */
    setPendingRefund(userId: UserId, amount: Amount): Promise<AdminAccountRow>;
    /**
     * / Set the recharge amount the admin requests from a user.
     */
    setRechargeRequest(userId: UserId, amount: Amount): Promise<AdminAccountRow>;
    /**
     * / Change any account's secondary password.
     */
    setSecondaryPassword(userId: UserId, newPassword: string): Promise<AdminAccountRow>;
    /**
     * / Set a VIP level's daily task quota and commission rate.
     */
    setVipConfig(level: VipLevel, dailyTaskQuota: bigint, commissionRate: bigint): Promise<VipConfig>;
    /**
     * / Change a user's VIP level.
     */
    setVipLevel(userId: UserId, level: VipLevel): Promise<AdminAccountRow>;
    /**
     * / Start a task: consume one daily quota slot and credit commission.
     */
    startTask(): Promise<TaskRecordView>;
    /**
     * / Mark the caller as online and return their account view.
     */
    touchSession(): Promise<AccountView | null>;
}
