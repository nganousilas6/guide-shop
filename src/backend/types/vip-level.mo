import Nat "mo:core/Nat";
import Order "mo:core/Order";

module {
  /// VIP level of an account.
  public type VipLevel = {
    #vip0;
    #vip1;
    #vip2;
    #vip3;
  };

  /// Ordering and equality for VipLevel, so it can key a Map/Set.
  public func compare(a : VipLevel, b : VipLevel) : Order.Order {
    let rank = func(level : VipLevel) : Nat = switch level {
      case (#vip0) { 0 };
      case (#vip1) { 1 };
      case (#vip2) { 2 };
      case (#vip3) { 3 };
    };
    Nat.compare(rank(a), rank(b));
  };

  public func equal(a : VipLevel, b : VipLevel) : Bool {
    compare(a, b) == #equal;
  };
};
