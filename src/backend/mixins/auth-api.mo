import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/auth";
import AuthLib "../lib/auth";

mixin (
  accessControlState : AccessControl.AccessControlState,
  accounts : Map.Map<Common.UserId, Types.Account>,
  phoneIndex : Map.Map<Text, Common.UserId>,
  promoIndex : Map.Map<Text, Common.UserId>,
  nextUserId : { var value : Nat },
  sessions : Map.Map<Principal, Common.UserId>,
  adminSessions : Map.Map<Principal, Bool>,
) {
  /// The admin account view returned to a signed-in admin caller.
  func adminView(now : Common.Timestamp) : Types.AccountView {
    {
      id = 0;
      phone = AuthLib.ADMIN_USERNAME;
      promoCode = "";
      vipLevel = #vip0;
      balance = 0;
      creditScore = 0;
      isOnline = true;
      blocked = false;
      createdAt = now;
    };
  };

  /// Resolve the signed-in caller's account, or trap when there is no session.
  func requireAuthAccount(caller : Principal) : Types.Account {
    let userId = sessions.get(caller) ?? Runtime.trap("Sign in required");
    accounts.get(userId) ?? Runtime.trap("Sign in required");
  };

  /// Register a new account at VIP0 with a required promo code.
  public shared ({ caller }) func register(
    phone : Text,
    password : Text,
    promoCode : Text,
    secondaryPassword : Text,
  ) : async Types.AccountView {
    if (phone.size() < 6) {
      Runtime.trap("Numero de telephone invalide");
    };
    if (not AuthLib.isStrongPassword(password)) {
      Runtime.trap("Le mot de passe doit contenir au moins 8 caracteres");
    };
    if (not AuthLib.isStrongPassword(secondaryPassword)) {
      Runtime.trap("Le mot de passe secondaire doit contenir au moins 8 caracteres");
    };
    if (promoCode.size() == 0) {
      Runtime.trap("Code promo requis");
    };
    if (phoneIndex.get(phone) != null) {
      Runtime.trap("Ce numero est deja enregistre");
    };
    switch (promoIndex.get(promoCode)) {
      case (null) { Runtime.trap("Code promo invalide") };
      case (?_) {};
    };

    let id = nextUserId.value;
    nextUserId.value := id + 1;
    let now = Time.now();
    let account : Types.Account = {
      id;
      phone;
      passwordHash = AuthLib.hashPassword(password);
      var password;
      var secondaryPasswordHash = AuthLib.hashPassword(secondaryPassword);
      var secondaryPassword;
      promoCode = AuthLib.makePromoCode(id);
      referredBy = ?promoCode;
      var vipLevel = #vip0;
      var balance = 0;
      var creditScore = 0;
      var blocked = false;
      var lastSeen = now;
      createdAt = now;
    };
    accounts.add(id, account);
    phoneIndex.add(phone, id);
    promoIndex.add(account.promoCode, id);
    sessions.add(caller, id);
    AuthLib.toView(account, now);
  };

  /// Sign in with phone number and password.
  public shared ({ caller }) func login(phone : Text, password : Text) : async Types.SessionView {
    let userId = phoneIndex.get(phone) ?? Runtime.trap("Identifiants invalides");
    let account = accounts.get(userId) ?? Runtime.trap("Identifiants invalides");
    if (account.passwordHash != AuthLib.hashPassword(password)) {
      Runtime.trap("Identifiants invalides");
    };
    if (account.blocked) {
      Runtime.trap("Compte bloque, contactez le service");
    };
    let now = Time.now();
    account.lastSeen := now;
    sessions.add(caller, userId);
    { account = AuthLib.toView(account, now); isAdmin = false };
  };

  /// Sign in the fixed admin account with username and password.
  public shared ({ caller }) func adminLogin(username : Text, password : Text) : async Types.SessionView {
    if (username != AuthLib.ADMIN_USERNAME or password != AuthLib.ADMIN_PASSWORD) {
      Runtime.trap("Identifiants administrateur invalides");
    };
    // Record the authenticated caller as admin. `initialize` only promotes the
    // very first caller ever, so a later admin login would otherwise be left
    // without the admin role and every admin-only call would be rejected.
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    // The fixed admin account has no `Account` row, so its sign-in is tracked
    // in `adminSessions`; this is what lets the account-scoped endpoints and
    // the admin console resolve the same caller after a refresh.
    adminSessions.add(caller, true);
    let now = Time.now();
    { account = adminView(now); isAdmin = true };
  };

  /// Return the signed-in caller's account view.
  public query ({ caller }) func getMyAccount() : async ?Types.AccountView {
    if (adminSessions.get(caller) == ?true) {
      return ?adminView(Time.now());
    };
    let userId = sessions.get(caller) ?? return null;
    switch (accounts.get(userId)) {
      case (null) { null };
      case (?account) { ?AuthLib.toView(account, Time.now()) };
    };
  };

  /// Change the caller's secondary withdrawal password.
  public shared ({ caller }) func changeSecondaryPassword(
    oldPassword : Text,
    newPassword : Text,
  ) : async Types.SecondaryPasswordError {
    let account = switch (sessions.get(caller)) {
      case (null) { return #notRegistered };
      case (?userId) {
        switch (accounts.get(userId)) {
          case (null) { return #notRegistered };
          case (?a) { a };
        };
      };
    };
    if (account.secondaryPasswordHash != AuthLib.hashPassword(oldPassword)) {
      return #wrongPassword;
    };
    if (not AuthLib.isStrongPassword(newPassword)) {
      return #weakPassword;
    };
    account.secondaryPasswordHash := AuthLib.hashPassword(newPassword);
    account.secondaryPassword := newPassword;
    #ok;
  };

  /// Mark the caller as online and return their account view.
  public shared ({ caller }) func touchSession() : async ?Types.AccountView {
    if (adminSessions.get(caller) == ?true) {
      return ?adminView(Time.now());
    };
    let userId = sessions.get(caller) ?? return null;
    switch (accounts.get(userId)) {
      case (null) { null };
      case (?account) {
        let now = Time.now();
        account.lastSeen := now;
        ?AuthLib.toView(account, now);
      };
    };
  };
};
