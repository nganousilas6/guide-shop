import Runtime "mo:core/Runtime";
import Common "../types/common";
import Types "../types/withdrawals";

module {
  public func toView(request : Types.WithdrawalRequest) : Types.WithdrawalView {
    {
      id = request.id;
      userId = request.userId;
      amount = request.amount;
      status = request.status;
      reviewedAt = request.reviewedAt;
      createdAt = request.createdAt;
    };
  };

  /// Request a withdrawal, confirmed with the secondary password.
  public func requestWithdrawal(
    amount : Common.Amount,
    secondaryPassword : Text,
  ) : async Types.WithdrawalView {
    ignore (amount, secondaryPassword);
    Runtime.trap("requestWithdrawal must be called on the actor");
  };

  /// List the caller's withdrawal requests with their statuses.
  public func listMyWithdrawals(limit : Nat, beforeId : ?Nat) : async [Types.WithdrawalView] {
    ignore (limit, beforeId);
    Runtime.trap("listMyWithdrawals must be called on the actor");
  };
};
