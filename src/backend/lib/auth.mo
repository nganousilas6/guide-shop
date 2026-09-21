import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import Types "../types/auth";

module {
  /// Fixed admin credentials. Only the operator knows these values.
  public let ADMIN_USERNAME = "silas1234";
  public let ADMIN_PASSWORD = "silas123456";

  /// An account is considered online when it was seen within this window.
  public let ONLINE_WINDOW_NS : Int = 120_000_000_000;

  /// Deterministic one-way digest used to store passwords without keeping the
  /// plaintext. Not a cryptographic hash, but it never leaves the canister.
  public func hashPassword(password : Text) : Text {
    var h : Nat = 5381;
    for (c in password.toIter()) {
      h := (h * 33 + c.toNat32().toNat()) % 1_000_000_007;
    };
    h.toText();
  };

  /// True when `password` meets the platform minimum length.
  public func isStrongPassword(password : Text) : Bool {
    password.size() >= Common.MIN_PASSWORD_LENGTH;
  };

  public func isOnline(lastSeen : Common.Timestamp, now : Common.Timestamp) : Bool {
    now - lastSeen < ONLINE_WINDOW_NS;
  };

  public func toView(account : Types.Account, now : Common.Timestamp) : Types.AccountView {
    {
      id = account.id;
      phone = account.phone;
      promoCode = account.promoCode;
      vipLevel = account.vipLevel;
      balance = account.balance;
      creditScore = account.creditScore;
      isOnline = isOnline(account.lastSeen, now);
      blocked = account.blocked;
      createdAt = account.createdAt;
    };
  };

  /// Build a unique promo code from the account id.
  public func makePromoCode(id : Common.UserId) : Text {
    "VIP" # id.toText() # "PROMO";
  };

  /// Register a new account at VIP0 and issue a unique promo code.
  public func register(
    phone : Text,
    password : Text,
    promoCode : Text,
    secondaryPassword : Text,
  ) : async Types.AccountView {
    ignore (phone, password, promoCode, secondaryPassword);
    Runtime.trap("register must be called on the actor");
  };

  /// Sign in with phone number and password.
  public func login(phone : Text, password : Text) : async Types.SessionView {
    ignore (phone, password);
    Runtime.trap("login must be called on the actor");
  };

  /// Sign in the fixed admin account with username and password.
  public func adminLogin(username : Text, password : Text) : async Types.SessionView {
    ignore (username, password);
    Runtime.trap("adminLogin must be called on the actor");
  };

  /// Return the account view for a user id.
  public func getAccount(userId : Common.UserId) : async ?Types.AccountView {
    ignore userId;
    Runtime.trap("getAccount must be called on the actor");
  };

  /// Change the caller's secondary withdrawal password.
  public func changeSecondaryPassword(
    oldPassword : Text,
    newPassword : Text,
  ) : async Types.SecondaryPasswordError {
    ignore (oldPassword, newPassword);
    Runtime.trap("changeSecondaryPassword must be called on the actor");
  };

  /// Mark the caller as online and return their account view.
  public func touchSession() : async ?Types.AccountView {
    Runtime.trap("touchSession must be called on the actor");
  };
};
