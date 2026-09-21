import Runtime "mo:core/Runtime";
import Common "../types/common";
import Types "../types/admin";
import TaskTypes "../types/tasks";
import WithdrawalTypes "../types/withdrawals";
import ServiceTypes "../types/service";

module {
  /// List every registered account for the admin dashboard.
  public func listAccounts(limit : Nat, beforeId : ?Nat) : async [Types.AdminAccountRow] {
    ignore (limit, beforeId);
    Runtime.trap("listAccounts must be called on the actor");
  };

  /// Add money to an account balance.
  public func addMoney(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    ignore (userId, amount);
    Runtime.trap("addMoney must be called on the actor");
  };

  /// Remove money from an account balance.
  public func removeMoney(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    ignore (userId, amount);
    Runtime.trap("removeMoney must be called on the actor");
  };

  /// Grant commission to an account.
  public func grantCommission(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    ignore (userId, amount);
    Runtime.trap("grantCommission must be called on the actor");
  };

  /// Change a user's VIP level.
  public func setVipLevel(userId : Common.UserId, level : Common.VipLevel) : async Types.AdminAccountRow {
    ignore (userId, level);
    Runtime.trap("setVipLevel must be called on the actor");
  };

  /// Set a VIP level's daily task quota and commission rate.
  public func setVipConfig(
    level : Common.VipLevel,
    dailyTaskQuota : Nat,
    commissionRate : Nat,
  ) : async TaskTypes.VipConfig {
    ignore (level, dailyTaskQuota, commissionRate);
    Runtime.trap("setVipConfig must be called on the actor");
  };

  /// Create and assign a daily task to an individual account.
  public func assignTaskToUser(
    userId : Common.UserId,
    merchant : Text,
    productDescription : Text,
    thumbnailUrl : Text,
    totalValue : Common.Amount,
  ) : async TaskTypes.TaskRecordView {
    ignore (userId, merchant, productDescription, thumbnailUrl, totalValue);
    Runtime.trap("assignTaskToUser must be called on the actor");
  };

  /// Create and assign a daily task to every account at a VIP level.
  public func assignTaskToVip(
    level : Common.VipLevel,
    merchant : Text,
    productDescription : Text,
    thumbnailUrl : Text,
    totalValue : Common.Amount,
  ) : async [TaskTypes.TaskRecordView] {
    ignore (level, merchant, productDescription, thumbnailUrl, totalValue);
    Runtime.trap("assignTaskToVip must be called on the actor");
  };

  /// List all pending withdrawal requests.
  public func listPendingWithdrawals(limit : Nat, beforeId : ?Nat) : async [WithdrawalTypes.WithdrawalView] {
    ignore (limit, beforeId);
    Runtime.trap("listPendingWithdrawals must be called on the actor");
  };

  /// Approve a withdrawal request, deducting the amount from the user's balance.
  public func approveWithdrawal(requestId : Nat) : async WithdrawalTypes.WithdrawalView {
    ignore requestId;
    Runtime.trap("approveWithdrawal must be called on the actor");
  };

  /// Reject a withdrawal request.
  public func rejectWithdrawal(requestId : Nat) : async WithdrawalTypes.WithdrawalView {
    ignore requestId;
    Runtime.trap("rejectWithdrawal must be called on the actor");
  };

  /// List all user conversations for the admin Service inbox.
  public func listConversations(limit : Nat, beforeUserId : ?Common.UserId) : async [ServiceTypes.ConversationSummary] {
    ignore (limit, beforeUserId);
    Runtime.trap("listConversations must be called on the actor");
  };

  /// Load a user's conversation history for the admin.
  public func listConversationMessages(
    userId : Common.UserId,
    limit : Nat,
    beforeId : ?Nat,
  ) : async [ServiceTypes.ChatMessageView] {
    ignore (userId, limit, beforeId);
    Runtime.trap("listConversationMessages must be called on the actor");
  };

  /// Reply to a user's conversation from the admin console.
  public func replyToUser(userId : Common.UserId, body : Text, attachment : ?ServiceTypes.Attachment) : async ServiceTypes.ChatMessageView {
    ignore (userId, body, attachment);
    Runtime.trap("replyToUser must be called on the actor");
  };

  /// Set the recharge amount the admin requests from a user.
  public func setRechargeRequest(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    ignore (userId, amount);
    Runtime.trap("setRechargeRequest must be called on the actor");
  };

  /// Credit a recharge to a user, increasing their available balance.
  public func creditRecharge(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    ignore (userId, amount);
    Runtime.trap("creditRecharge must be called on the actor");
  };

  /// Set the refund amount promised to a user (Montant de remboursement en attente).
  public func setPendingRefund(userId : Common.UserId, amount : Common.Amount) : async Types.AdminAccountRow {
    ignore (userId, amount);
    Runtime.trap("setPendingRefund must be called on the actor");
  };

  /// Block or unblock an account.
  public func setAccountBlocked(userId : Common.UserId, blocked : Bool) : async Types.AdminAccountRow {
    ignore (userId, blocked);
    Runtime.trap("setAccountBlocked must be called on the actor");
  };

  /// Change any account's secondary password.
  public func setSecondaryPassword(userId : Common.UserId, newPassword : Text) : async Types.AdminAccountRow {
    ignore (userId, newPassword);
    Runtime.trap("setSecondaryPassword must be called on the actor");
  };

  /// Delete a user's entire chat thread from the Service inbox.
  public func clearConversation(userId : Common.UserId) : async () {
    ignore userId;
    Runtime.trap("clearConversation must be called on the actor");
  };
};
