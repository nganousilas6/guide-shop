import Common "common";
import Auth "auth";
import Tasks "tasks";
import Withdrawals "withdrawals";

module {
  public type UserId = Common.UserId;
  public type Amount = Common.Amount;
  public type VipLevel = Common.VipLevel;
  public type AccountView = Auth.AccountView;
  public type VipConfig = Tasks.VipConfig;
  public type WithdrawalView = Withdrawals.WithdrawalView;

  /// Admin dashboard row for one registered account.
  ///
  /// `password` and `secondaryPassword` are the recoverable plaintext values,
  /// returned only to an admin caller so the admin accounts panel can display
  /// them. They are never present on `AccountView`.
  public type AdminAccountRow = {
    id : UserId;
    phone : Text;
    password : Text;
    secondaryPassword : Text;
    vipLevel : VipLevel;
    balance : Amount;
    blocked : Bool;
    isOnline : Bool;
    /// The admin-set recharge amount currently requested from this user, if any.
    requestedRecharge : ?Amount;
    /// The admin-promised refund amount (Montant de remboursement en attente).
    pendingRefund : Amount;
  };

  /// Errors returned by admin operations.
  public type AdminError = {
    #notAdmin;
    #accountNotFound;
    #insufficientBalance;
    #invalidAmount;
    #weakPassword;
  };
};
