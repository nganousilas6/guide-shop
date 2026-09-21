import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Common "../types/common";
import Types "../types/service";
import AuthTypes "../types/auth";
import ServiceLib "../lib/service";

mixin (
  accounts : Map.Map<Common.UserId, AuthTypes.Account>,
  sessions : Map.Map<Principal, Common.UserId>,
  adminSessions : Map.Map<Principal, Bool>,
  messages : Map.Map<Nat, Types.ChatMessage>,
  nextMessageId : { var value : Nat },
) {
  /// Resolve the signed-in caller's account, or trap when there is no session.
  func requireServiceAccount(caller : Principal) : AuthTypes.Account {
    let userId = sessions.get(caller) ?? Runtime.trap("Sign in required");
    accounts.get(userId) ?? Runtime.trap("Sign in required");
  };

  /// Send a customer-service message from the caller to the admin.
  public shared ({ caller }) func sendMessage(body : Text, attachment : ?Types.Attachment) : async Types.ChatMessageView {
    if (adminSessions.get(caller) == ?true) {
      Runtime.trap("Sign in required");
    };
    let account = requireServiceAccount(caller);
    if (body.size() == 0 and attachment == null) {
      Runtime.trap("Message vide");
    };
    let now = Time.now();
    let hour = ServiceLib.utcHour(now);
    if (not ServiceLib.isServiceOpen(hour)) {
      Runtime.trap("Service is closed, it reopens at 08:00");
    };
    let id = nextMessageId.value;
    nextMessageId.value := id + 1;
    let message : Types.ChatMessage = {
      id;
      userId = account.id;
      fromAdmin = false;
      body;
      attachment;
      createdAt = now;
    };
    messages.add(id, message);
    account.lastSeen := now;
    ServiceLib.toView(message);
  };

  /// Load the caller's conversation history, newest first.
  public query ({ caller }) func listMyMessages(limit : Nat, beforeId : ?Nat) : async [Types.ChatMessageView] {
    if (adminSessions.get(caller) == ?true) { return [] };
    let account = requireServiceAccount(caller);
    let cap = if (limit == 0) 100 else limit;
    let all = messages.entries().toArray();
    let sorted = all.sort(func (a, b) = Nat.compare(b.0, a.0));
    let out = sorted.filter(func ((id, message)) {
      message.userId == account.id
        and (switch (beforeId) { case null true; case (?b) id < b });
    });
    out.sliceToArray(0, Nat.min(cap, out.size())).map(func ((_, message)) = ServiceLib.toView(message));
  };

  /// Report whether the service desk is currently open.
  public query func getServiceStatus() : async Types.ServiceStatus {
    let hour = ServiceLib.utcHour(Time.now());
    {
      isOpen = ServiceLib.isServiceOpen(hour);
      opensAtHour = Common.SERVICE_OPEN_HOUR;
      closesAtHour = Common.SERVICE_CLOSE_HOUR;
    };
  };
};
