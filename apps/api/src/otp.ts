import { createHash, randomInt } from "node:crypto";
import { Otps } from "./db.js";

export type OtpChannel = "sms" | "whatsapp" | "email";
export type OtpPurpose = "verify" | "reset";

export const OTP_TTL_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;
export const IS_DEV = process.env.NODE_ENV !== "production";

function hashCode(code: string): string {
  return createHash("sha256").update(`${process.env.JWT_SECRET ?? "dev"}:${code}`).digest("hex");
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${phone.startsWith("+") ? "+" : ""}${"*".repeat(Math.max(0, digits.length - 3))}${digits.slice(-3)}`;
}

export function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}***@${d}`;
}

/** Create + deliver a 6-digit code. Returns the code (dev only usage). */
export async function issueOtp(userId: number, purpose: OtpPurpose, channel: OtpChannel, to: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
  Otps.create(userId, purpose, channel, hashCode(code), expiresAt);
  await deliver(channel, to, code, purpose);
  return code;
}

export type VerifyResult = "ok" | "expired" | "invalid" | "locked" | "none";

export function verifyOtp(userId: number, purpose: OtpPurpose, code: string): VerifyResult {
  const row = Otps.latest(userId, purpose);
  if (!row) return "none";
  if (row.expires_at < Date.now()) return "expired";
  if (row.attempts >= MAX_ATTEMPTS) return "locked";
  if (row.code_hash !== hashCode(code)) {
    Otps.bumpAttempts(row.id);
    return "invalid";
  }
  Otps.markUsed(row.id);
  return "ok";
}

/**
 * Delivery. In dev we print to the console. In production, set OTP_WEBHOOK_URL to a
 * provider bridge (Twilio, WhatsApp Cloud API, SendGrid...). The bridge receives
 * { channel, to, code, purpose } as JSON.
 */
async function deliver(channel: OtpChannel, to: string, code: string, purpose: OtpPurpose) {
  const url = process.env.OTP_WEBHOOK_URL;
  if (url) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OTP_WEBHOOK_TOKEN ?? ""}` },
        body: JSON.stringify({ channel, to, code, purpose }),
      });
      return;
    } catch (err) {
      console.error("[otp] webhook delivery failed:", err);
    }
  }
  console.log(`\n  ┌─────────────────────────────────────────┐`);
  console.log(`  │  OTP (${purpose}) via ${channel.padEnd(8)} → ${to.padEnd(16)} │`);
  console.log(`  │  CODE: ${code}                           │`);
  console.log(`  └─────────────────────────────────────────┘\n`);
}
