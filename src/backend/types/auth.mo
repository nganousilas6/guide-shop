import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type Amount = Common.Amount;
  public type VipLevel = Common.VipLevel;

  /// A registered platform account.
  ///
  /// `password` and `secondaryPassword` hold the recoverable plaintext so the
  /// admin can read them back; `passwordHash` / `secondaryPasswordHash` remain
  /// the values used for authentication. Only `AdminAccountRow` ever exposes
  /// the plaintext, and only to an admin caller.
  public type Account = {
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

  /// Public view of an account (no secrets).
  public type AccountView = {
    id : UserId;
    phone : Text;
    promoCode : Text;
    vipLevel : VipLevel;
    balance : Amount;
    creditScore : Nat;
    isOnline : Bool;
    blocked : Bool;
    createdAt : Timestamp;
  };

  /// Result of a successful sign-in.
  public type SessionView = {
    account : AccountView;
    isAdmin : Bool;
  };

  /// Errors returned by registration and sign-in.
  public type AuthError = {
    #phoneTaken;
    #invalidCredentials;
    #invalidPromoCode;
    #weakPassword;
    #notRegistered;
    #accountBlocked;
  };

  /// Result of a secondary-password change: `#ok` on success, otherwise the error.
  public type SecondaryPasswordError = {
    #ok;
    #wrongPassword;
    #notRegistered;
    #weakPassword;
  };
};
