import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type UserId = Nat;
  type Timestamp = Int;
  type Amount = Nat;

  type VipLevel = { #vip0; #vip1; #vip2; #vip3 };
  type WithdrawalStatus = { #pending; #approved; #rejected };
  type RecordStatus = { #soumission; #termine; #frozen };

  type Account = {
    id : UserId;
    phone : Text;
    passwordHash : Text;
    var secondaryPasswordHash : Text;
    promoCode : Text;
    referredBy : ?Text;
    var vipLevel : VipLevel;
    var balance : Amount;
    var creditScore : Nat;
    var lastSeen : Timestamp;
    createdAt : Timestamp;
  };

  type VipConfig = {
    level : VipLevel;
    dailyTaskQuota : Nat;
    commissionRate : Nat;
  };

  type TaskRecord = {
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

  type CommissionEntry = {
    id : Nat;
    userId : UserId;
    amount : Amount;
    source : Text;
    createdAt : Timestamp;
  };

  type WithdrawalRequest = {
    id : Nat;
    userId : UserId;
    amount : Amount;
    var status : WithdrawalStatus;
    var reviewedAt : ?Timestamp;
    createdAt : Timestamp;
  };

  type ChatMessage = {
    id : Nat;
    userId : UserId;
    fromAdmin : Bool;
    body : Text;
    createdAt : Timestamp;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    accounts : Map.Map<UserId, Account>;
    phoneIndex : Map.Map<Text, UserId>;
    promoIndex : Map.Map<Text, UserId>;
    nextUserId : { var value : Nat };
    sessions : Map.Map<Principal, UserId>;
    vipConfigs : Map.Map<VipLevel, VipConfig>;
    taskRecords : Map.Map<Nat, TaskRecord>;
    nextRecordId : { var value : Nat };
    commissions : Map.Map<Nat, CommissionEntry>;
    nextCommissionId : { var value : Nat };
    dailyCounters : Map.Map<Text, Nat>;
    withdrawals : Map.Map<Nat, WithdrawalRequest>;
    nextWithdrawalId : { var value : Nat };
    messages : Map.Map<Nat, ChatMessage>;
    nextMessageId : { var value : Nat };
  };

  public func migration(_old : {}) : NewActor {
    {
      accessControlState = AccessControl.initState();
      accounts = Map.empty();
      phoneIndex = Map.empty();
      promoIndex = Map.empty();
      nextUserId = { var value = 1 };
      sessions = Map.empty();
      vipConfigs = Map.empty();
      taskRecords = Map.empty();
      nextRecordId = { var value = 1 };
      commissions = Map.empty();
      nextCommissionId = { var value = 1 };
      dailyCounters = Map.empty();
      withdrawals = Map.empty();
      nextWithdrawalId = { var value = 1 };
      messages = Map.empty();
      nextMessageId = { var value = 1 };
    };
  };
};
