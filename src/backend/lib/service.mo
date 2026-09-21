import Runtime "mo:core/Runtime";
import Common "../types/common";
import Types "../types/service";

module {
  public func toView(message : Types.ChatMessage) : Types.ChatMessageView {
    {
      id = message.id;
      userId = message.userId;
      fromAdmin = message.fromAdmin;
      body = message.body;
      attachment = message.attachment;
      createdAt = message.createdAt;
    };
  };

  /// Whether the service desk is open at the given UTC hour.
  public func isServiceOpen(hour : Nat) : Bool {
    hour >= Common.SERVICE_OPEN_HOUR and hour < Common.SERVICE_CLOSE_HOUR;
  };

  /// The UTC hour (0-23) of a nanosecond timestamp.
  public func utcHour(now : Common.Timestamp) : Nat {
    let seconds = now / 1_000_000_000;
    let daySeconds = seconds % 86_400;
    let positive = if (daySeconds < 0) daySeconds + 86_400 else daySeconds;
    positive.toNat() / 3600;
  };

  /// Send a customer-service message from the caller to the admin.
  public func sendMessage(body : Text, attachment : ?Types.Attachment) : async Types.ChatMessageView {
    ignore (body, attachment);
    Runtime.trap("sendMessage must be called on the actor");
  };

  /// Load the caller's conversation history, newest first.
  public func listMyMessages(limit : Nat, beforeId : ?Nat) : async [Types.ChatMessageView] {
    ignore (limit, beforeId);
    Runtime.trap("listMyMessages must be called on the actor");
  };

  /// Report whether the service desk is currently open.
  public func getServiceStatus() : async Types.ServiceStatus {
    Runtime.trap("getServiceStatus must be called on the actor");
  };
};
