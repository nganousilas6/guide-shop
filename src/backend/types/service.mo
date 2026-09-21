import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type AttachmentKind = Common.AttachmentKind;

  /// A file attached to a chat message, stored via platform object storage.
  public type Attachment = {
    blob : Storage.ExternalBlob;
    kind : AttachmentKind;
    name : Text;
    size : Nat;
  };

  /// A single customer-service chat message.
  public type ChatMessage = {
    id : Nat;
    userId : UserId;
    fromAdmin : Bool;
    body : Text;
    attachment : ?Attachment;
    createdAt : Timestamp;
  };

  /// Shared view of a chat message.
  public type ChatMessageView = {
    id : Nat;
    userId : UserId;
    fromAdmin : Bool;
    body : Text;
    attachment : ?Attachment;
    createdAt : Timestamp;
  };

  /// A conversation summary for the admin Service inbox.
  public type ConversationSummary = {
    userId : UserId;
    phone : Text;
    lastMessage : Text;
    lastMessageAt : Timestamp;
    unreadCount : Nat;
  };

  /// Whether the customer-service desk is currently open.
  public type ServiceStatus = {
    isOpen : Bool;
    /// UTC hour (0-23) at which the desk next opens.
    opensAtHour : Nat;
    /// UTC hour (0-23) at which the desk closes.
    closesAtHour : Nat;
  };
};
