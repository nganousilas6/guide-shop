import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type Amount = Common.Amount;
  public type WithdrawalStatus = Common.WithdrawalStatus;

  /// A withdrawal request created by a user and reviewed by the admin.
  public type WithdrawalRequest = {
    id : Nat;
    userId : UserId;
    amount : Amount;
    var status : WithdrawalStatus;
    var reviewedAt : ?Timestamp;
    createdAt : Timestamp;
  };

  /// Shared view of a withdrawal request.
  public type WithdrawalView = {
    id : Nat;
    userId : UserId;
    amount : Amount;
    status : WithdrawalStatus;
    reviewedAt : ?Timestamp;
    createdAt : Timestamp;
  };

  /// Errors returned by withdrawal operations.
  public type WithdrawalError = {
    #tasksIncomplete;
    #insufficientBalance;
    #wrongPassword;
    #notRegistered;
    #alreadyReviewed;
    #notFound;
    #belowMinimum;
    #accountBlocked;
  };
};
