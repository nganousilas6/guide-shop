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
  type AttachmentKind = { #image; #video; #file };

  // --- Previous (deployed) shapes ---
  // The deployed baseline predates the account-blocking and chat-attachment
  // contract, so `Account` has no `blocked` field and `ChatMessage` has no
  // `attachment` field.
  type OldAccount = {
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

  type OldChatMessage = {
    id : Nat;
    userId : UserId;
    fromAdmin : Bool;
    body : Text;
    createdAt : Timestamp;
  };

  // --- New shapes ---
  type Account = {
    id : UserId;
    phone : Text;
    passwordHash : Text;
    var password : Text;
    var secondaryPasswordHash : Text;
    var secondaryPassword : Text;
    promoCode : Text;
    referredBy : ?Text;
    var vipLevel : VipLevel;
    var balance : Amount;
    var creditScore : Nat;
    var blocked : Bool;
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

  type Attachment = {
    blob : Blob;
    kind : AttachmentKind;
    name : Text;
    size : Nat;
  };

  type ChatMessage = {
    id : Nat;
    userId : UserId;
    fromAdmin : Bool;
    body : Text;
    attachment : ?Attachment;
    createdAt : Timestamp;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    accounts : Map.Map<UserId, OldAccount>;
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
    messages : Map.Map<Nat, OldChatMessage>;
    nextMessageId : { var value : Nat };
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
    rechargeRequests : Map.Map<UserId, Amount>;
    pendingRefunds : Map.Map<UserId, Amount>;
  };

  public func migration(old : OldActor) : NewActor {
    let accounts = old.accounts.map<UserId, OldAccount, Account>(
      func(_, account) {
        {
          id = account.id;
          phone = account.phone;
          passwordHash = account.passwordHash;
          var password = "";
          var secondaryPasswordHash = account.secondaryPasswordHash;
          var secondaryPassword = "";
          promoCode = account.promoCode;
          referredBy = account.referredBy;
          var vipLevel = account.vipLevel;
          var balance = account.balance;
          var creditScore = account.creditScore;
          var blocked = false;
          var lastSeen = account.lastSeen;
          createdAt = account.createdAt;
        };
      }
    );

    let messages = old.messages.map<Nat, OldChatMessage, ChatMessage>(
      func(_, message) {
        {
          id = message.id;
          userId = message.userId;
          fromAdmin = message.fromAdmin;
          body = message.body;
          attachment = null;
          createdAt = message.createdAt;
        };
      }
    );

    {
      accessControlState = old.accessControlState;
      accounts;
      phoneIndex = old.phoneIndex;
      promoIndex = old.promoIndex;
      nextUserId = old.nextUserId;
      sessions = old.sessions;
      vipConfigs = old.vipConfigs;
      taskRecords = old.taskRecords;
      nextRecordId = old.nextRecordId;
      commissions = old.commissions;
      nextCommissionId = old.nextCommissionId;
      dailyCounters = old.dailyCounters;
      withdrawals = old.withdrawals;
      nextWithdrawalId = old.nextWithdrawalId;
      messages;
      nextMessageId = old.nextMessageId;
      rechargeRequests = Map.empty();
      pendingRefunds = Map.empty();
    };
  };
};
