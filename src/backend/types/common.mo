import Nat "mo:core/Nat";
import Order "mo:core/Order";
import VipLevelModule "vip-level";

module {
  /// Unique identifier for a user account.
  public type UserId = Nat;

  /// Nanosecond timestamp (Time.now()).
  public type Timestamp = Int;

  /// Monetary amount in FCFA (integer, no decimals).
  public type Amount = Nat;

  /// VIP level of an account.
  public type VipLevel = VipLevelModule.VipLevel;

  /// Ordering and equality for VipLevel, so it can key a Map/Set.
  public module VipLevel {
    public func compare(a : VipLevel, b : VipLevel) : Order.Order {
      VipLevelModule.compare(a, b);
    };

    public func equal(a : VipLevel, b : VipLevel) : Bool {
      VipLevelModule.equal(a, b);
    };
  };

  /// Lifecycle status of a withdrawal request.
  public type WithdrawalStatus = {
    #pending;
    #approved;
    #rejected;
  };

  /// Lifecycle status of a task/order record.
  public type RecordStatus = {
    #soumission;
    #termine;
    #frozen;
  };

  /// Kind of file attached to a customer-service chat message.
  public type AttachmentKind = {
    #image;
    #video;
    #file;
  };

  /// Minimum number of characters required for every password on the platform
  /// (registration password, secondary password, admin password).
  public let MIN_PASSWORD_LENGTH : Nat = 8;

  /// Minimum withdrawal amount in FCFA.
  public let MIN_WITHDRAWAL_AMOUNT : Amount = 2000;

  /// Default daily task quota for VIP0 when the admin has not configured it.
  public let DEFAULT_VIP0_DAILY_QUOTA : Nat = 30;

  /// Default commission rate in FCFA for VIP0 when the admin has not configured it.
  public let DEFAULT_VIP0_COMMISSION_RATE : Nat = 500;

  /// Service desk opening hour (UTC, inclusive) and closing hour (UTC, exclusive).
  /// The desk is closed from 18:00 to 08:00 and reopens at 08:00.
  public let SERVICE_OPEN_HOUR : Nat = 8;
  public let SERVICE_CLOSE_HOUR : Nat = 18;
};
