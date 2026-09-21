import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import Types "../types/tasks";

module {
  /// The UTC day key (YYYYMMDD) used for daily task counters.
  public func dayKey(now : Common.Timestamp) : Text {
    let seconds = now / 1_000_000_000;
    let days = seconds / 86_400;
    let civil = days + 719_468;
    let era = (if (civil >= 0) civil else civil - 146_096) / 146_097;
    let doe = civil - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) mp + 3 else mp - 9;
    let year = if (m <= 2) y + 1 else y;
    year.toText() # "-" # pad2(m) # "-" # pad2(d);
  };

  func pad2(n : Int) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() };
  };

  /// Composite key for a user's counter on a given day.
  public func counterKey(userId : Common.UserId, day : Text) : Text {
    userId.toText() # ":" # day;
  };

  public func toView(record : Types.TaskRecord) : Types.TaskRecordView {
    {
      id = record.id;
      userId = record.userId;
      merchant = record.merchant;
      productDescription = record.productDescription;
      thumbnailUrl = record.thumbnailUrl;
      totalValue = record.totalValue;
      commission = record.commission;
      status = record.status;
      createdAt = record.createdAt;
    };
  };

  /// Return the caller's daily task progress for the Demarrage tab.
  public func getDailyProgress() : async Types.DailyProgress {
    Runtime.trap("getDailyProgress must be called on the actor");
  };

  /// Start a task: consume one daily quota slot and credit commission.
  public func startTask() : async Types.TaskRecordView {
    Runtime.trap("startTask must be called on the actor");
  };

  /// List the caller's task/order records, optionally filtered by status.
  public func listRecords(status : ?Common.RecordStatus, limit : Nat, beforeId : ?Nat) : async [Types.TaskRecordView] {
    ignore (status, limit, beforeId);
    Runtime.trap("listRecords must be called on the actor");
  };

  /// Fetch a single task record owned by the caller.
  public func getRecord(recordId : Nat) : async ?Types.TaskRecordView {
    ignore recordId;
    Runtime.trap("getRecord must be called on the actor");
  };

  /// List the caller's commission entries for the Accueil tab.
  public func listCommissions(limit : Nat, beforeId : ?Nat) : async [Types.CommissionEntry] {
    ignore (limit, beforeId);
    Runtime.trap("listCommissions must be called on the actor");
  };

  /// Return the admin-configured settings for every VIP level.
  public func listVipConfigs() : async [Types.VipConfig] {
    Runtime.trap("listVipConfigs must be called on the actor");
  };
};
