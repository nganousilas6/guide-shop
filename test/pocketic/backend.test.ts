import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * PocketIC backend lane for the accepted Fob Shop requirements.
 *
 * This installs the app's own compiled wasm into the platform's PocketIC
 * replica and calls the real public API, so it is the only lane that can catch
 * a canister whose public methods are unimplemented stubs that trap at runtime.
 * The frontend suite mocks the actor and cannot see that class of defect.
 *
 * The declarations' shapes are the Candid ones: `?T` is `[] | [T]`, `Nat` is
 * `bigint`, and a variant is `{ variantName: null }`.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far; a failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error.
  await pic?.tearDown();
});

describe("open reads on a fresh canister", () => {
  it("answers the service status without trapping", async () => {
    const status = await actor.getServiceStatus();
    expect(status.opensAtHour).toBe(8n);
    expect(status.closesAtHour).toBe(18n);
    expect(typeof status.isOpen).toBe("boolean");
  });

  it("answers the VIP config list without trapping", async () => {
    const configs = await actor.listVipConfigs();
    // The canister seeds a config for every VIP level.
    expect(configs).toHaveLength(4);
    for (const config of configs) {
      expect(typeof config.dailyTaskQuota).toBe("bigint");
      expect(typeof config.commissionRate).toBe("bigint");
    }
  });

  it("answers the API doc without trapping", async () => {
    const doc = await actor.getApiDoc();
    expect(doc).toContain("Platform API");
  });

  it("returns no account for an anonymous caller", async () => {
    actor.setPrincipal(Principal.anonymous());
    await expect(actor.getMyAccount()).resolves.toEqual([]);
  });
});

describe("admin login", () => {
  it("accepts the fixed credentials and reports the admin role", async () => {
    actor.setPrincipal(Principal.anonymous());
    const session = await actor.adminLogin("silas1234", "silas123456");
    expect(session.isAdmin).toBe(true);
    expect(session.account.phone).toBe("silas1234");
  });

  it("rejects a wrong password", async () => {
    actor.setPrincipal(Principal.anonymous());
    await expect(
      actor.adminLogin("silas1234", "wrongpassword"),
    ).rejects.toThrow();
  });
});

describe("password minimum length", () => {
  it("rejects a registration password shorter than 8 characters", async () => {
    actor.setPrincipal(Principal.anonymous());
    await expect(
      actor.register("+2250700000001", "short7", "VIP1PROMO", "withdraw1"),
    ).rejects.toThrow(/8/);
  });

  it("rejects a secondary password shorter than 8 characters", async () => {
    actor.setPrincipal(Principal.anonymous());
    await expect(
      actor.register("+2250700000002", "secret123", "VIP1PROMO", "short7"),
    ).rejects.toThrow(/8/);
  });
});

describe("admin authorization", () => {
  it("rejects a non-admin caller on an admin-only method", async () => {
    // A principal that never signed in as the fixed admin cannot read the
    // account rows, so it can never see a password through this method.
    actor.setPrincipal(Principal.fromText("aaaaa-aa"));
    await expect(actor.listAccounts(50n, [])).rejects.toThrow();
  });

  it("grants the admin role to the caller that just signed in", async () => {
    // Regression: `initialize` only promotes the very first caller ever, so a
    // later admin login used to leave the caller without the admin role and
    // every admin-only call was rejected. `adminLogin` must record the
    // authenticated caller as admin.
    const admin = Principal.fromText("aaaaa-aa");
    actor.setPrincipal(admin);
    const session = await actor.adminLogin("silas1234", "silas123456");
    expect(session.isAdmin).toBe(true);

    // The same caller can now reach an admin-only method.
    await expect(actor.listAccounts(50n, [])).resolves.toBeInstanceOf(Array);
  });
});
