import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type Amount = Common.Amount;
  public type VipLevel = Common.VipLevel;
  public type RecordStatus = Common.RecordStatus;

  /// Admin-configured settings for one VIP level.
  public type VipConfig = {
    level : VipLevel;
    dailyTaskQuota : Nat;
    commissionRate : Nat;
  };

  /// A task/order record belonging to a user.
  public type TaskRecord = {
    id : Nat;
    userId : UserId;
    merchant : Text;
    productDescription : Text;
    thumbnailUrl : Text;
    totalValue : Amount;
    commission : Amount;
    var status : RecordStatus;
    createdAt : Timestamp;
  };

  /// Shared view of a task record.
  public type TaskRecordView = {
    id : Nat;
    userId : UserId;
    merchant : Text;
    productDescription : Text;
    thumbnailUrl : Text;
    totalValue : Amount;
    commission : Amount;
    status : RecordStatus;
    createdAt : Timestamp;
  };

  /// A commission entry shown on the Accueil tab.
  public type CommissionEntry = {
    id : Nat;
    userId : UserId;
    amount : Amount;
    source : Text;
    createdAt : Timestamp;
  };

  /// Daily task progress for the Demarrage tab.
  public type DailyProgress = {
    vipLevel : VipLevel;
    completedToday : Nat;
    dailyTaskQuota : Nat;
    commissionRate : Nat;
    availableBalance : Amount;
    pendingRefund : Amount;
    commissionEarned : Amount;
    canStartTask : Bool;
    blocked : Bool;
    /// True when the account has no available balance and must be recharged
    /// before a task can start.
    insufficientBalance : Bool;
    /// The admin-set recharge amount currently requested from this user, if any.
    requestedRecharge : ?Amount;
  };

  /// Errors returned by task operations.
  public type TaskError = {
    #quotaReached;
    #notRegistered;
    #noTaskAssigned;
    #insufficientBalance;
    #accountBlocked;
  };
};
