import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import VipLevel "../types/vip-level";
import Types "../types/tasks";
import AuthTypes "../types/auth";
import TaskLib "../lib/tasks";

mixin (
  accounts : Map.Map<Common.UserId, AuthTypes.Account>,
  sessions : Map.Map<Principal, Common.UserId>,
  adminSessions : Map.Map<Principal, Bool>,
  vipConfigs : Map.Map<Common.VipLevel, Types.VipConfig>,
  taskRecords : Map.Map<Nat, Types.TaskRecord>,
  nextRecordId : { var value : Nat },
  commissions : Map.Map<Nat, Types.CommissionEntry>,
  nextCommissionId : { var value : Nat },
  dailyCounters : Map.Map<Text, Nat>,
  rechargeRequests : Map.Map<Common.UserId, Common.Amount>,
  pendingRefunds : Map.Map<Common.UserId, Common.Amount>,
) {
  /// Resolve the signed-in caller's account, or trap when there is no session.
  func requireTaskAccount(caller : Principal) : AuthTypes.Account {
    let userId = sessions.get(caller) ?? Runtime.trap("Sign in required");
    accounts.get(userId) ?? Runtime.trap("Sign in required");
  };

  /// True when the caller signed in through the fixed admin account. The admin
  /// has no `Account` row, so the account-scoped reads return an empty result
  /// for it instead of trapping.
  func isAdminSession(caller : Principal) : Bool {
    adminSessions.get(caller) == ?true;
  };

  /// The admin-configured quota and rate for a VIP level, with VIP0 defaults.
  func configFor(level : Common.VipLevel) : Types.VipConfig {
    switch (vipConfigs.get(level)) {
      case (?config) { config };
      case (null) {
        {
          level;
          dailyTaskQuota = Common.DEFAULT_VIP0_DAILY_QUOTA;
          commissionRate = Common.DEFAULT_VIP0_COMMISSION_RATE;
        };
      };
    };
  };

  /// Return the caller's daily task progress for the Demarrage tab.
  public query ({ caller }) func getDailyProgress() : async Types.DailyProgress {
    if (isAdminSession(caller)) {
      return {
        vipLevel = #vip0;
        completedToday = 0;
        dailyTaskQuota = Common.DEFAULT_VIP0_DAILY_QUOTA;
        commissionRate = Common.DEFAULT_VIP0_COMMISSION_RATE;
        availableBalance = 0;
        pendingRefund = 0;
        commissionEarned = 0;
        canStartTask = false;
        blocked = false;
        insufficientBalance = true;
        requestedRecharge = null;
      };
    };
    let account = requireTaskAccount(caller);
    let config = configFor(account.vipLevel);
    let day = TaskLib.dayKey(Time.now());
    let completedToday = dailyCounters.get(TaskLib.counterKey(account.id, day)) ?? 0;
    let pendingRefund = pendingRefunds.get(account.id) ?? 0;
    let commissionEarned = commissions.entries().foldLeft(
      0,
      func (total, (_, entry)) {
        if (entry.userId == account.id) { total + entry.amount } else { total };
      },
    );
    let insufficientBalance = account.balance == 0;
    {
      vipLevel = account.vipLevel;
      completedToday;
      dailyTaskQuota = config.dailyTaskQuota;
      commissionRate = config.commissionRate;
      availableBalance = account.balance;
      pendingRefund;
      commissionEarned;
      canStartTask = not account.blocked and not insufficientBalance and completedToday < config.dailyTaskQuota;
      blocked = account.blocked;
      insufficientBalance;
      requestedRecharge = rechargeRequests.get(account.id);
    };
  };

  /// Start a task: consume one daily quota slot and credit commission.
  public shared ({ caller }) func startTask() : async Types.TaskRecordView {
    if (isAdminSession(caller)) {
      Runtime.trap("Sign in required");
    };
    let account = requireTaskAccount(caller);
    if (account.blocked) {
      Runtime.trap("Account is blocked");
    };
    if (account.balance == 0) {
      Runtime.trap("insuffisant balance, contact the service form to continue");
    };
    let config = configFor(account.vipLevel);
    let now = Time.now();
    let day = TaskLib.dayKey(now);
    let key = TaskLib.counterKey(account.id, day);
    let completedToday = dailyCounters.get(key) ?? 0;
    if (completedToday >= config.dailyTaskQuota) {
      Runtime.trap("Daily tasks are complete for today");
    };

    let recordId = nextRecordId.value;
    nextRecordId.value := recordId + 1;
    let record : Types.TaskRecord = {
      id = recordId;
      userId = account.id;
      merchant = "Tache journaliere";
      productDescription = "Tache quotidienne VIP";
      thumbnailUrl = "";
      totalValue = config.commissionRate;
      commission = config.commissionRate;
      var status = #termine;
      createdAt = now;
    };
    taskRecords.add(recordId, record);
    dailyCounters.add(key, completedToday + 1);

    let commissionId = nextCommissionId.value;
    nextCommissionId.value := commissionId + 1;
    commissions.add(commissionId, {
      id = commissionId;
      userId = account.id;
      amount = config.commissionRate;
      source = "Tache journaliere";
      createdAt = now;
    });
    account.balance += config.commissionRate;
    account.creditScore += 1;
    account.lastSeen := now;
    TaskLib.toView(record);
  };

  /// List the caller's task/order records, optionally filtered by status.
  public query ({ caller }) func listRecords(status : ?Common.RecordStatus, limit : Nat, beforeId : ?Nat) : async [Types.TaskRecordView] {
    if (isAdminSession(caller)) { return [] };
    let account = requireTaskAccount(caller);
    let cap = if (limit == 0) 100 else limit;
    let all = taskRecords.entries().toArray();
    let sorted = all.sort(func (a, b) = Nat.compare(b.0, a.0));
    let out = sorted.filter(func ((id, record)) {
      record.userId == account.id
        and (switch (status) { case null true; case (?s) record.status == s })
        and (switch (beforeId) { case null true; case (?b) id < b });
    });
    out.sliceToArray(0, Nat.min(cap, out.size())).map(func ((_, record)) = TaskLib.toView(record));
  };

  /// Fetch a single task record owned by the caller.
  public query ({ caller }) func getRecord(recordId : Nat) : async ?Types.TaskRecordView {
    if (isAdminSession(caller)) { return null };
    let account = requireTaskAccount(caller);
    switch (taskRecords.get(recordId)) {
      case (null) { null };
      case (?record) {
        if (record.userId == account.id) { ?TaskLib.toView(record) } else { null };
      };
    };
  };

  /// List the caller's commission entries for the Accueil tab.
  public query ({ caller }) func listCommissions(limit : Nat, beforeId : ?Nat) : async [Types.CommissionEntry] {
    if (isAdminSession(caller)) { return [] };
    let account = requireTaskAccount(caller);
    let cap = if (limit == 0) 100 else limit;
    let all = commissions.entries().toArray();
    let sorted = all.sort(func (a, b) = Nat.compare(b.0, a.0));
    let out = sorted.filter(func ((id, entry)) {
      entry.userId == account.id
        and (switch (beforeId) { case null true; case (?b) id < b });
    });
    out.sliceToArray(0, Nat.min(cap, out.size())).map(func ((_, entry)) = entry);
  };

  /// Return the admin-configured settings for every VIP level.
  public query func listVipConfigs() : async [Types.VipConfig] {
    let levels : [Common.VipLevel] = [#vip0, #vip1, #vip2, #vip3];
    levels.map(func level = configFor(level));
  };
};
