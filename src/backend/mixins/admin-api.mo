import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import VipLevel "../types/vip-level";
import Types "../types/admin";
import AuthTypes "../types/auth";
import TaskTypes "../types/tasks";
import WithdrawalTypes "../types/withdrawals";
import ServiceTypes "../types/service";
import AuthLib "../lib/auth";
import TaskLib "../lib/tasks";
import WithdrawalLib "../lib/withdrawals";
import ServiceLib "../lib/service";

mixin (
  accessControlState : AccessControl.AccessControlState,
  accounts : Map.Map<Common.UserId, AuthTypes.Account>,
  adminSessions : Map.Map<Principal, Bool>,
  vipConfigs : Map.Map<Common.VipLevel, TaskTypes.VipConfig>,
  taskRecords : Map.Map<Nat, TaskTypes.TaskRecord>,
  nextRecordId : { var value : Nat },
  commissions : Map.Map<Nat, TaskTypes.CommissionEntry>,
  nextCommissionId : { var value : Nat },
  withdrawals : Map.Map<Nat, WithdrawalTypes.WithdrawalRequest>,
  messages : Map.Map<Nat, ServiceTypes.ChatMessage>,
  nextMessageId : { var value : Nat },
  rechargeRequests : Map.Map<Common.UserId, Common.Amount>,
  pendingRefunds : Map.Map<Common.UserId, Common.Amount>,
) {
  /// Trap unless the caller holds the admin role. The role map is read directly
  /// because `AccessControl.isAdmin` traps for a principal that was never
  /// registered, which would surface as a confusing error instead of the
  /// intended authorization rejection.
  func requireAdmin(caller : Principal) {
    let isAdmin = switch (accessControlState.userRoles.get(caller)) {
      case (?#admin) { true };
      case (_) { false };
    };
    if (not isAdmin and adminSessions.get(caller) != ?true) {
      Runtime.trap("Unauthorized: admin only");
    };
  };

  /// Resolve an account by id, or trap when it does not exist.
  func requireTarget(userId : Common.UserId) : AuthTypes.Account {
    accounts.get(userId) ?? Runtime.trap("Account not found");
  };

  /// Build the admin dashboard row for an account.
  func toRow(account : AuthTypes.Account) : Types.AdminAccountRow {
    {
      id = account.id;
      phone = account.phone;
      password = account.password;
      secondaryPassword = account.secondaryPassword;
      vipLevel = account.vipLevel;
      balance = account.balance;
      blocked = account.blocked;
      isOnline = AuthLib.isOnline(account.lastSeen, Time.now());
      requestedRecharge = rechargeRequests.get(account.id);
      pendingRefund = pendingRefunds.get(account.id) ?? 0;
    };
  };

  /// List every registered account for the admin dashboard.
  public query ({ caller }) func listAccounts(limit : Nat, beforeId : ?Nat) : async [Types.AdminAccountRow] {
    requireAdmin(caller);
    let cap = if (limit == 0) 100 else limit;
    let all = accounts.entries().toArray();
    let sorted = all.sort(func (a, b) = Nat.compare(b.0, a.0));
    let out = sorted.filter(func ((id, _)) {
      switch (beforeId) { case null true; case (?b) id < b };
    });
    out.sliceToArray(0, Nat.min(cap, out.size())).map(func ((_, account)) = toRow(account));
  };

  /// Add money to an account balance.
  public shared ({ caller }) func addMoney(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    account.balance += amount;
    toRow(account);
  };

  /// Remove money from an account balance.
  public shared ({ caller }) func removeMoney(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    if (amount > account.balance) {
      Runtime.trap("Insufficient balance");
    };
    account.balance -= amount;
    toRow(account);
  };

  /// Grant commission to an account.
  public shared ({ caller }) func grantCommission(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    let now = Time.now();
    let id = nextCommissionId.value;
    nextCommissionId.value := id + 1;
    commissions.add(id, {
      id;
      userId;
      amount;
      source = "Commission administrateur";
      createdAt = now;
    });
    account.balance += amount;
    toRow(account);
  };

  /// Change a user's VIP level.
  public shared ({ caller }) func setVipLevel(userId : Common.UserId, level : Common.VipLevel) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    account.vipLevel := level;
    toRow(account);
  };

  /// Set a VIP level's daily task quota and commission rate.
  public shared ({ caller }) func setVipConfig(
    level : Common.VipLevel,
    dailyTaskQuota : Nat,
    commissionRate : Nat,
  ) : async TaskTypes.VipConfig {
    requireAdmin(caller);
    let config : TaskTypes.VipConfig = { level; dailyTaskQuota; commissionRate };
    vipConfigs.add(level, config);
    config;
  };

  /// Create and assign a daily task to an individual account.
  public shared ({ caller }) func assignTaskToUser(
    userId : Common.UserId,
    merchant : Text,
    productDescription : Text,
    thumbnailUrl : Text,
    totalValue : Common.Amount,
  ) : async TaskTypes.TaskRecordView {
    requireAdmin(caller);
    ignore requireTarget(userId);
    let id = nextRecordId.value;
    nextRecordId.value := id + 1;
    let record : TaskTypes.TaskRecord = {
      id;
      userId;
      merchant;
      productDescription;
      thumbnailUrl;
      totalValue;
      commission = 0;
      var status = #soumission;
      createdAt = Time.now();
    };
    taskRecords.add(id, record);
    TaskLib.toView(record);
  };

  /// Create and assign a daily task to every account at a VIP level.
  public shared ({ caller }) func assignTaskToVip(
    level : Common.VipLevel,
    merchant : Text,
    productDescription : Text,
    thumbnailUrl : Text,
    totalValue : Common.Amount,
  ) : async [TaskTypes.TaskRecordView] {
    requireAdmin(caller);
    let now = Time.now();
    let targets = accounts.entries().toArray().filter(func ((_, account)) = Common.VipLevel.equal(account.vipLevel, level));
    targets.map(func ((_, account)) {
      let id = nextRecordId.value;
      nextRecordId.value := id + 1;
      let record : TaskTypes.TaskRecord = {
        id;
        userId = account.id;
        merchant;
        productDescription;
        thumbnailUrl;
        totalValue;
        commission = 0;
        var status = #soumission;
        createdAt = now;
      };
      taskRecords.add(id, record);
      TaskLib.toView(record);
    });
  };

  /// List all pending withdrawal requests.
  public query ({ caller }) func listPendingWithdrawals(limit : Nat, beforeId : ?Nat) : async [WithdrawalTypes.WithdrawalView] {
    requireAdmin(caller);
    let cap = if (limit == 0) 100 else limit;
    let all = withdrawals.entries().toArray();
    let sorted = all.sort(func (a, b) = Nat.compare(b.0, a.0));
    let out = sorted.filter(func ((id, request)) {
      request.status == #pending
        and (switch (beforeId) { case null true; case (?b) id < b });
    });
    out.sliceToArray(0, Nat.min(cap, out.size())).map(func ((_, request)) = WithdrawalLib.toView(request));
  };

  /// Approve a withdrawal request, deducting the amount from the user's balance.
  public shared ({ caller }) func approveWithdrawal(requestId : Nat) : async WithdrawalTypes.WithdrawalView {
    requireAdmin(caller);
    let request = withdrawals.get(requestId) ?? Runtime.trap("Withdrawal request not found");
    if (request.status != #pending) {
      Runtime.trap("Withdrawal request already reviewed");
    };
    let account = requireTarget(request.userId);
    if (request.amount > account.balance) {
      Runtime.trap("Insufficient balance");
    };
    account.balance -= request.amount;
    request.status := #approved;
    request.reviewedAt := ?Time.now();
    WithdrawalLib.toView(request);
  };

  /// Reject a withdrawal request.
  public shared ({ caller }) func rejectWithdrawal(requestId : Nat) : async WithdrawalTypes.WithdrawalView {
    requireAdmin(caller);
    let request = withdrawals.get(requestId) ?? Runtime.trap("Withdrawal request not found");
    if (request.status != #pending) {
      Runtime.trap("Withdrawal request already reviewed");
    };
    request.status := #rejected;
    request.reviewedAt := ?Time.now();
    WithdrawalLib.toView(request);
  };

  /// List all user conversations for the admin Service inbox.
  public query ({ caller }) func listConversations(limit : Nat, beforeUserId : ?Common.UserId) : async [ServiceTypes.ConversationSummary] {
    requireAdmin(caller);
    let cap = if (limit == 0) 100 else limit;
    let all = messages.entries().toArray();
    let sorted = all.sort(func (a, b) = Nat.compare(b.0, a.0));
    // A user message counts as unread until the admin replies after it: the
    // newest admin reply in the thread is the read watermark.
    let lastAdminReplyAt = Map.empty<Common.UserId, Common.Timestamp>();
    for ((_, message) in sorted.values()) {
      if (message.fromAdmin) {
        switch (lastAdminReplyAt.get(message.userId)) {
          case (null) { lastAdminReplyAt.add(message.userId, message.createdAt) };
          case (?seen) {
            if (message.createdAt > seen) {
              lastAdminReplyAt.add(message.userId, message.createdAt);
            };
          };
        };
      };
    };
    let summaries = sorted.foldLeft<(Nat, ServiceTypes.ChatMessage), [ServiceTypes.ConversationSummary]>(
      [],
      func (acc, entry) {
        let message = entry.1;
        if (acc.any(func (s) = s.userId == message.userId)) {
          acc;
        } else {
          let phone = switch (accounts.get(message.userId)) {
            case (?account) { account.phone };
            case (null) { "" };
          };
          let unreadCount = sorted.foldLeft(
            0,
            func (count, (_, candidate)) {
              if (candidate.userId == message.userId and not candidate.fromAdmin) {
                switch (lastAdminReplyAt.get(message.userId)) {
                  case (null) { count + 1 };
                  case (?seen) {
                    if (candidate.createdAt > seen) { count + 1 } else { count };
                  };
                };
              } else {
                count;
              };
            },
          );
          acc.concat([{
            userId = message.userId;
            phone;
            lastMessage = message.body;
            lastMessageAt = message.createdAt;
            unreadCount;
          }]);
        };
      }
    );
    let filtered = summaries.filter(func (s) {
      switch (beforeUserId) { case null true; case (?b) s.userId < b };
    });
    filtered.sliceToArray(0, Nat.min(cap, filtered.size()));
  };

  /// Load a user's conversation history for the admin.
  public query ({ caller }) func listConversationMessages(
    userId : Common.UserId,
    limit : Nat,
    beforeId : ?Nat,
  ) : async [ServiceTypes.ChatMessageView] {
    requireAdmin(caller);
    let cap = if (limit == 0) 100 else limit;
    let all = messages.entries().toArray();
    let sorted = all.sort(func (a, b) = Nat.compare(b.0, a.0));
    let out = sorted.filter(func ((id, message)) {
      message.userId == userId
        and (switch (beforeId) { case null true; case (?b) id < b });
    });
    out.sliceToArray(0, Nat.min(cap, out.size())).map(func ((_, message)) = ServiceLib.toView(message));
  };

  /// Reply to a user's conversation from the admin console.
  public shared ({ caller }) func replyToUser(userId : Common.UserId, body : Text, attachment : ?ServiceTypes.Attachment) : async ServiceTypes.ChatMessageView {
    requireAdmin(caller);
    ignore requireTarget(userId);
    if (body.size() == 0 and attachment == null) {
      Runtime.trap("Message vide");
    };
    let id = nextMessageId.value;
    nextMessageId.value := id + 1;
    let message : ServiceTypes.ChatMessage = {
      id;
      userId;
      fromAdmin = true;
      body;
      attachment;
      createdAt = Time.now();
    };
    messages.add(id, message);
    ServiceLib.toView(message);
  };

  /// Set the recharge amount the admin requests from a user.
  public shared ({ caller }) func setRechargeRequest(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    rechargeRequests.add(userId, amount);
    toRow(account);
  };

  /// Credit a recharge to a user, increasing their available balance.
  public shared ({ caller }) func creditRecharge(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    account.balance += amount;
    rechargeRequests.remove(userId);
    toRow(account);
  };

  /// Set the refund amount promised to a user (Montant de remboursement en attente).
  public shared ({ caller }) func setPendingRefund(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    pendingRefunds.add(userId, amount);
    toRow(account);
  };

  /// Block or unblock an account.
  public shared ({ caller }) func setAccountBlocked(userId : Common.UserId, blocked : Bool) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    account.blocked := blocked;
    toRow(account);
  };

  /// Change any account's secondary password.
  public shared ({ caller }) func setSecondaryPassword(userId : Common.UserId, newPassword : Text) : async Types.AdminAccountRow {
    requireAdmin(caller);
    let account = requireTarget(userId);
    if (not AuthLib.isStrongPassword(newPassword)) {
      Runtime.trap("Le mot de passe secondaire doit contenir au moins 8 caracteres");
    };
    account.secondaryPasswordHash := AuthLib.hashPassword(newPassword);
    account.secondaryPassword := newPassword;
    toRow(account);
  };

  /// Delete a user's entire chat thread from the Service inbox.
  public shared ({ caller }) func clearConversation(userId : Common.UserId) : async () {
    requireAdmin(caller);
    let snapshot = messages.entries().toArray();
    for ((id, message) in snapshot.values()) {
      if (message.userId == userId) {
        messages.remove(id);
      };
    };
  };
};
