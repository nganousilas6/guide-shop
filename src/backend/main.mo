import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Expose "mo:caffeineai-oql/Expose";
import OQL "mo:caffeineai-oql";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import IntValue "mo:caffeineai-oql/IntValue";
import BoolValue "mo:caffeineai-oql/BoolValue";

import Common "types/common";
import AuthTypes "types/auth";
import TaskTypes "types/tasks";
import WithdrawalTypes "types/withdrawals";
import ServiceTypes "types/service";

import AuthMixin "mixins/auth-api";
import TasksMixin "mixins/tasks-api";
import WithdrawalsMixin "mixins/withdrawals-api";
import ServiceMixin "mixins/service-api";
import AdminMixin "mixins/admin-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // Variant columns are rendered as text so OQL clients can filter on exact
  // literals instead of guessing at a structural encoding.
  func vipLevelToText(level : Common.VipLevel) : Text = switch level {
    case (#vip0) "vip0";
    case (#vip1) "vip1";
    case (#vip2) "vip2";
    case (#vip3) "vip3";
  };

  func recordStatusToText(status : Common.RecordStatus) : Text = switch status {
    case (#soumission) "soumission";
    case (#termine) "termine";
    case (#frozen) "frozen";
  };

  func withdrawalStatusToText(status : Common.WithdrawalStatus) : Text = switch status {
    case (#pending) "pending";
    case (#approved) "approved";
    case (#rejected) "rejected";
  };

  func attachmentKindToText(kind : Common.AttachmentKind) : Text = switch kind {
    case (#image) "image";
    case (#video) "video";
    case (#file) "file";
  };

  // --- Authorization component state ---
  let accessControlState : AccessControl.AccessControlState;

  // --- Domain state ---
  let accounts : Map.Map<Common.UserId, AuthTypes.Account>;
  let phoneIndex : Map.Map<Text, Common.UserId>;
  let promoIndex : Map.Map<Text, Common.UserId>;
  let nextUserId : { var value : Nat };
  let sessions : Map.Map<Principal, Common.UserId>;
  // Admin sign-ins are tracked separately from user sessions: the fixed admin
  // account has no `Account` row, so it cannot be represented in `sessions`.
  let adminSessions : Map.Map<Principal, Bool>;

  let vipConfigs : Map.Map<Common.VipLevel, TaskTypes.VipConfig>;
  let taskRecords : Map.Map<Nat, TaskTypes.TaskRecord>;
  let nextRecordId : { var value : Nat };
  let commissions : Map.Map<Nat, TaskTypes.CommissionEntry>;
  let nextCommissionId : { var value : Nat };
  let dailyCounters : Map.Map<Text, Nat>;

  let withdrawals : Map.Map<Nat, WithdrawalTypes.WithdrawalRequest>;
  let nextWithdrawalId : { var value : Nat };

  let messages : Map.Map<Nat, ServiceTypes.ChatMessage>;
  let nextMessageId : { var value : Nat };

  // --- Recharge state ---
  // Admin-set recharge amount requested from a user, and the refund amount the
  // admin has promised to that user (Montant de remboursement en attente).
  let rechargeRequests : Map.Map<Common.UserId, Common.Amount>;
  let pendingRefunds : Map.Map<Common.UserId, Common.Amount>;

  // --- Component mixins ---
  include MixinAuthorization(accessControlState, null);
  include MixinObjectStorage();

  // --- Domain API mixins ---
  include AuthMixin(accessControlState, accounts, phoneIndex, promoIndex, nextUserId, sessions, adminSessions);
  include TasksMixin(accounts, sessions, adminSessions, vipConfigs, taskRecords, nextRecordId, commissions, nextCommissionId, dailyCounters, rechargeRequests, pendingRefunds);
  include WithdrawalsMixin(accounts, sessions, adminSessions, vipConfigs, dailyCounters, withdrawals, nextWithdrawalId);
  include ServiceMixin(accounts, sessions, adminSessions, messages, nextMessageId);
  include AdminMixin(accessControlState, accounts, adminSessions, vipConfigs, taskRecords, nextRecordId, commissions, nextCommissionId, withdrawals, messages, nextMessageId, rechargeRequests, pendingRefunds);
  include ApiDocMixin();

  // --- OQL exposure ---
  // `Account`, `TaskRecord`, and `WithdrawalRequest` carry `var` fields and
  // variant fields, so structural `_toRow` derivation cannot apply. Each
  // entity declares its columns explicitly via `toEntityManual` + `.payload`.
  include Expose({
    entities = [
      accounts.toEntityManual("account", "Account", "id")
        .payload("id", func (a : AuthTypes.Account) : Nat = a.id)
        .payload("phone", func (a : AuthTypes.Account) : Text = a.phone)
        .payload("promoCode", func (a : AuthTypes.Account) : Text = a.promoCode)
        .payload("referredBy", func (a : AuthTypes.Account) : Text = a.referredBy ?? "")
        .payload("vipLevel", func (a : AuthTypes.Account) : Text = vipLevelToText(a.vipLevel))
        .payload("balance", func (a : AuthTypes.Account) : Nat = a.balance)
        .payload("creditScore", func (a : AuthTypes.Account) : Nat = a.creditScore)
        .payload("blocked", func (a : AuthTypes.Account) : Bool = a.blocked)
        .payload("lastSeen", func (a : AuthTypes.Account) : Int = a.lastSeen)
        .payload("createdAt", func (a : AuthTypes.Account) : Int = a.createdAt)
        .hidden("passwordHash")
        .hidden("password")
        .hidden("secondaryPasswordHash")
        .hidden("secondaryPassword")
        .controllerOnly()
        .build(),
      taskRecords.toEntityManual("taskRecord", "TaskRecord", "id")
        .payload("id", func (t : TaskTypes.TaskRecord) : Nat = t.id)
        .payload("userId", func (t : TaskTypes.TaskRecord) : Nat = t.userId)
        .payload("merchant", func (t : TaskTypes.TaskRecord) : Text = t.merchant)
        .payload("productDescription", func (t : TaskTypes.TaskRecord) : Text = t.productDescription)
        .payload("thumbnailUrl", func (t : TaskTypes.TaskRecord) : Text = t.thumbnailUrl)
        .payload("totalValue", func (t : TaskTypes.TaskRecord) : Nat = t.totalValue)
        .payload("commission", func (t : TaskTypes.TaskRecord) : Nat = t.commission)
        .payload("status", func (t : TaskTypes.TaskRecord) : Text = recordStatusToText(t.status))
        .payload("createdAt", func (t : TaskTypes.TaskRecord) : Int = t.createdAt)
        .controllerOnly()
        .build(),
      withdrawals.toEntityManual("withdrawal", "WithdrawalRequest", "id")
        .payload("id", func (w : WithdrawalTypes.WithdrawalRequest) : Nat = w.id)
        .payload("userId", func (w : WithdrawalTypes.WithdrawalRequest) : Nat = w.userId)
        .payload("amount", func (w : WithdrawalTypes.WithdrawalRequest) : Nat = w.amount)
        .payload("status", func (w : WithdrawalTypes.WithdrawalRequest) : Text = withdrawalStatusToText(w.status))
        .payload("reviewedAt", func (w : WithdrawalTypes.WithdrawalRequest) : Int = w.reviewedAt ?? 0)
        .payload("createdAt", func (w : WithdrawalTypes.WithdrawalRequest) : Int = w.createdAt)
        .controllerOnly()
        .build(),
      commissions.toEntityManual("commission", "CommissionEntry", "id")
        .payload("id", func (c : TaskTypes.CommissionEntry) : Nat = c.id)
        .payload("userId", func (c : TaskTypes.CommissionEntry) : Nat = c.userId)
        .payload("amount", func (c : TaskTypes.CommissionEntry) : Nat = c.amount)
        .payload("source", func (c : TaskTypes.CommissionEntry) : Text = c.source)
        .payload("createdAt", func (c : TaskTypes.CommissionEntry) : Int = c.createdAt)
        .controllerOnly()
        .build(),
      messages.toEntityManual("serviceMessage", "ChatMessage", "id")
        .payload("id", func (m : ServiceTypes.ChatMessage) : Nat = m.id)
        .payload("userId", func (m : ServiceTypes.ChatMessage) : Nat = m.userId)
        .payload("fromAdmin", func (m : ServiceTypes.ChatMessage) : Bool = m.fromAdmin)
        .payload("body", func (m : ServiceTypes.ChatMessage) : Text = m.body)
        .payload("attachmentKind", func (m : ServiceTypes.ChatMessage) : Text = switch (m.attachment) {
          case null "";
          case (?a) attachmentKindToText(a.kind);
        })
        .payload("attachmentName", func (m : ServiceTypes.ChatMessage) : Text = switch (m.attachment) {
          case null "";
          case (?a) a.name;
        })
        .payload("attachmentSize", func (m : ServiceTypes.ChatMessage) : Nat = switch (m.attachment) {
          case null 0;
          case (?a) a.size;
        })
        .payload("createdAt", func (m : ServiceTypes.ChatMessage) : Int = m.createdAt)
        .controllerOnly()
        .build(),
      vipConfigs.toEntityManual("vipConfig", "VipConfig", "level")
        .payload("level", func (v : TaskTypes.VipConfig) : Text = vipLevelToText(v.level))
        .payload("dailyTaskQuota", func (v : TaskTypes.VipConfig) : Nat = v.dailyTaskQuota)
        .payload("commissionRate", func (v : TaskTypes.VipConfig) : Nat = v.commissionRate)
        .controllerOnly()
        .build(),
      OQL.Entity.manual<(Text, Nat)>("dailyCounter", func () = dailyCounters.entries(), "DailyCounter", "key")
        .sample(("", 0))
        .payload("key", func ((k, _)) = k)
        .payload("count", func ((_, n)) = n)
        .controllerOnly()
        .build(),
      OQL.Entity.manual<(Nat, Common.Amount)>("rechargeRequest", func () = rechargeRequests.entries(), "RechargeRequest", "userId")
        .sample((0, 0))
        .payload("userId", func ((userId, _)) = userId)
        .payload("amount", func ((_, amount)) = amount)
        .controllerOnly()
        .build(),
      OQL.Entity.manual<(Nat, Common.Amount)>("pendingRefund", func () = pendingRefunds.entries(), "PendingRefund", "userId")
        .sample((0, 0))
        .payload("userId", func ((userId, _)) = userId)
        .payload("amount", func ((_, amount)) = amount)
        .controllerOnly()
        .build(),
    ];
  });
};
