import { describe, expect, it, vi } from "vitest";
import { updateRecoveredPassword, verifyRecoverySession } from "@/lib/password-recovery";

const resetUrl = "https://hippomedicine.com/reset-password";

function sessionAuth() {
  return {
    initialize: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "synthetic-user" } } }, error: null }),
  };
}

describe("password recovery initialization", () => {
  it("waits for the automatic PKCE exchange before accepting the session", async () => {
    const auth = sessionAuth();
    let currentUrl = `${resetUrl}?code=synthetic-code`;
    let finishInitialization!: () => void;
    auth.initialize.mockImplementation(() => new Promise((resolve) => {
      finishInitialization = () => {
        currentUrl = resetUrl;
        resolve({ error: null });
      };
    }));
    const result = verifyRecoverySession(auth, () => currentUrl);
    expect(auth.getSession).not.toHaveBeenCalled();
    finishInitialization();
    await expect(result).resolves.toBe(true);
    expect(auth.getSession).toHaveBeenCalledOnce();
  });

  it.each([
    "?error=access_denied&error_code=otp_expired",
    "#error=access_denied&error_description=Link+expired",
    "?error_code=otp_expired",
    "#error_code=otp_expired",
  ])("rejects an error redirect %s even when another login exists", async (suffix) => {
    const auth = sessionAuth();
    await expect(verifyRecoverySession(auth, () => resetUrl + suffix)).resolves.toBe(false);
    expect(auth.initialize).not.toHaveBeenCalled();
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it("rejects an SDK exchange error instead of accepting an older stored session", async () => {
    const auth = sessionAuth();
    auth.initialize.mockResolvedValue({ error: { message: "Invalid recovery code" } });
    await expect(verifyRecoverySession(auth, () => resetUrl)).resolves.toBe(false);
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it.each(["?code=unexchanged", "#access_token=unexchanged", "?token_hash=unverified"])("rejects unconsumed recovery credentials %s", async (suffix) => {
    const auth = sessionAuth();
    await expect(verifyRecoverySession(auth, () => resetUrl + suffix)).resolves.toBe(false);
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it("rejects missing and errored sessions", async () => {
    const auth = sessionAuth();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(verifyRecoverySession(auth, () => resetUrl)).resolves.toBe(false);
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: "old-user" } } }, error: { message: "Expired session" } });
    await expect(verifyRecoverySession(auth, () => resetUrl)).resolves.toBe(false);
  });

  it("handles thrown initialization and session network failures", async () => {
    const auth = sessionAuth();
    auth.initialize.mockRejectedValueOnce(new Error("offline"));
    await expect(verifyRecoverySession(auth, () => resetUrl)).resolves.toBe(false);
    auth.getSession.mockRejectedValueOnce(new Error("offline"));
    await expect(verifyRecoverySession(auth, () => resetUrl)).resolves.toBe(false);
  });

  it("keeps an established valid session usable after the SDK has cleaned the callback URL", async () => {
    await expect(verifyRecoverySession(sessionAuth(), () => resetUrl)).resolves.toBe(true);
  });
});

describe("updating a recovered password", () => {
  it.each(["", "1234567"])("refuses a short password without an SDK request", async (password) => {
    const auth = { updateUser: vi.fn() };
    await expect(updateRecoveredPassword(auth, password, password)).resolves.toEqual({ ok: false, error: "Password must be at least 8 characters." });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("refuses mismatched confirmation without an SDK request", async () => {
    const auth = { updateUser: vi.fn() };
    await expect(updateRecoveredPassword(auth, "synthetic-password", "different-password")).resolves.toEqual({ ok: false, error: "Passwords do not match." });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("passes a matching password unchanged and reports successful completion", async () => {
    const auth = { updateUser: vi.fn().mockResolvedValue({ error: null }) };
    await expect(updateRecoveredPassword(auth, " synthetic-password ", " synthetic-password ")).resolves.toEqual({ ok: true, error: "" });
    expect(auth.updateUser).toHaveBeenCalledOnce();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: " synthetic-password " });
  });

  it("surfaces SDK update failures so the form can retry", async () => {
    const auth = { updateUser: vi.fn().mockResolvedValue({ error: { message: "Session expired. Request a new link." } }) };
    await expect(updateRecoveredPassword(auth, "synthetic-password", "synthetic-password")).resolves.toEqual({ ok: false, error: "Session expired. Request a new link." });
  });

  it("resolves thrown network failures into a retryable result rather than leaving the form loading", async () => {
    const auth = { updateUser: vi.fn().mockRejectedValue(new Error("offline")) };
    await expect(updateRecoveredPassword(auth, "synthetic-password", "synthetic-password")).resolves.toEqual({ ok: false, error: "Connection failed. Please try again." });
  });
});
