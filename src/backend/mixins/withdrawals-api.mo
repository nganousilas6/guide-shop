import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import VipLevel "../types/vip-level";
import Types "../types/withdrawals";
import AuthTypes "../types/auth";
import TaskTypes "../types/tasks";
import AuthLib "../lib/auth";
import TaskLib "../lib/tasks";
import WithdrawalLib "../lib/withdrawals";

mixin (
  accounts : Map.Map<Common.UserId, AuthTypes.Account>,
  sessions : Map.Map<Principal, Common.UserId>,
  adminSessions : Map.Map<Principal, Bool>,
  vipConfigs : Map.Map<Common.VipLevel, TaskTypes.VipConfig>,
  dailyCounters : Map.Map<Text, Nat>,
  withdrawals : Map.Map<Nat, Types.WithdrawalRequest>,
  nextWithdrawalId : { var value : Nat },
) {
  /// Resolve the signed-in caller's account, or trap when there is no session.
  func requireWithdrawalAccount(caller : Principal) : AuthTypes.Account {
    let userId = sessions.get(caller) ?? Runtime.trap("Sign in required");
    accounts.get(userId) ?? Runtime.trap("Sign in required");
  };

  /// Request a withdrawal, confirmed with the secondary password.
  public shared ({ caller }) func requestWithdrawal(
    amount : Common.Amount,
    secondaryPassword : Text,
  ) : async Types.WithdrawalView {
    if (adminSessions.get(caller) == ?true) {
      Runtime.trap("Sign in required");
    };
    let account = requireWithdrawalAccount(caller);
    if (amount < Common.MIN_WITHDRAWAL_AMOUNT) {
      Runtime.trap("Le montant minimum de retrait est de 2000 FCFA");
    };
    if (account.blocked) {
      Runtime.trap("Account is blocked");
    };
    if (account.secondaryPasswordHash != AuthLib.hashPassword(secondaryPassword)) {
      Runtime.trap("Mot de passe secondaire incorrect");
    };
    let quota = switch (vipConfigs.get(account.vipLevel)) {
      case (?config) { config.dailyTaskQuota };
      case (null) { Common.DEFAULT_VIP0_DAILY_QUOTA };
    };
    let completedToday = dailyCounters.get(TaskLib.counterKey(account.id, TaskLib.dayKey(Time.now()))) ?? 0;
    if (completedToday < quota) {
      Runtime.trap("Taches journalieres incompletes");
    };
    if (amount > account.balance) {
      Runtime.trap("Solde insuffisant");
    };

    let id = nextWithdrawalId.value;
    nextWithdrawalId.value := id + 1;
    let request : Types.WithdrawalRequest = {
      id;
      userId = account.id;
      amount;
      var status = #pending;
      var reviewedAt = null;
      createdAt = Time.now();
    };
    withdrawals.add(id, request);
    WithdrawalLib.toView(request);
  };

  /// List the caller's withdrawal requests with their statuses.
  public query ({ caller }) func listMyWithdrawals(limit : Nat, beforeId : ?Nat) : async [Types.WithdrawalView] {
    if (adminSessions.get(caller) == ?true) { return [] };
    let account = requireWithdrawalAccount(caller);
    let cap = if (limit == 0) 100 else limit;
    let all = withdrawals.entries().toArray();
    let sorted = all.sort(func (a, b) = Nat.compare(b.0, a.0));
    let out = sorted.filter(func ((id, request)) {
      request.userId == account.id
        and (switch (beforeId) { case null true; case (?b) id < b });
    });
    out.sliceToArray(0, Nat.min(cap, out.size())).map(func ((_, request)) = WithdrawalLib.toView(request));
  };
};
