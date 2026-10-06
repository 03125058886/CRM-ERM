import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  validateSignup, validateLogin, SUBDOMAIN_RE, EMAIL_RE, isValidAppId, type SignupPayload, type AuthResponse,
} from "@nexora/shared";
import { Users, toUser, type UserRow } from "./db.js";
import { issueOtp, verifyOtp, maskPhone, maskEmail, OTP_TTL_SECONDS, IS_DEV, type OtpChannel } from "./otp.js";
import { rateLimit } from "./middleware.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "nexora-dev-secret-change-me";
const SESSION_TTL = "7d";
const PENDING_TTL = "15m";

export const auth = Router();

type PendingClaims = { sub: number; purpose: "verify" | "reset" };

function signSession(user: UserRow): string {
  return jwt.sign({ sub: String(user.id), kind: "session" }, JWT_SECRET, { expiresIn: SESSION_TTL });
}
function signPending(userId: number, purpose: PendingClaims["purpose"]): string {
  return jwt.sign({ sub: String(userId), kind: "pending", purpose }, JWT_SECRET, { expiresIn: PENDING_TTL });
}
function readPending(token: string): PendingClaims | null {
  try {
    const c = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (c.kind !== "pending") return null;
    return { sub: Number(c.sub), purpose: c.purpose };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    const c = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (c.kind !== "session") throw new Error("bad kind");
    const user = Users.findById(Number(c.sub));
    if (!user) throw new Error("no user");
    (req as Request & { user: UserRow }).user = user;
    next();
  } catch {
    res.status(401).json({ error: "Please sign in again." });
  }
}

export function currentUser(req: Request): UserRow {
  return (req as Request & { user: UserRow }).user;
}

async function sendVerification(user: UserRow, channel: OtpChannel) {
  const to = channel === "email" ? user.email : user.phone;
  const code = await issueOtp(user.id, "verify", channel, to);
  return {
    pendingId: signPending(user.id, "verify"),
    channel,
    maskedPhone: channel === "email" ? maskEmail(user.email) : maskPhone(user.phone),
    expiresIn: OTP_TTL_SECONDS,
    ...(IS_DEV ? { devCode: code } : {}),
  };
}

/* ---------- subdomain availability ---------- */
auth.get("/check-subdomain", (req, res) => {
  const name = String(req.query.name ?? "").toLowerCase();
  if (!SUBDOMAIN_RE.test(name)) return res.json({ available: false, reason: "invalid" });
  const reserved = ["www", "api", "app", "admin", "mail", "nexora", "support", "help"];
  if (reserved.includes(name)) return res.json({ available: false, reason: "reserved" });
  res.json({ available: !Users.subdomainTaken(name) });
});

/* ---------- signup ---------- */
auth.post("/signup", rateLimit(10, 60_000), async (req, res) => {
  const body = req.body as Partial<SignupPayload>;
  const errors = validateSignup(body);
  if (Object.keys(errors).length) {
    const [field, message] = Object.entries(errors)[0];
    return res.status(400).json({ error: message, field, errors });
  }
  const p = body as SignupPayload;
  if (Users.findByEmail(p.email)) return res.status(409).json({ error: "An account with this email already exists.", field: "email" });
  if (Users.subdomainTaken(p.subdomain)) return res.status(409).json({ error: "That domain is already taken.", field: "subdomain" });

  const passwordHash = await bcrypt.hash(p.password, 10);
  const user = Users.create({
    firstName: p.firstName.trim(), lastName: p.lastName.trim(), email: p.email.trim(), phone: p.phone.trim(),
    company: p.company.trim(), subdomain: p.subdomain, country: p.country, language: p.language,
    companySize: p.companySize, interest: p.interest, passwordHash, apps: [...new Set(p.apps)],
  });
  const pending = await sendVerification(user, "sms");
  res.status(201).json({ requiresVerification: true, ...pending });
});

/* ---------- verify ---------- */
auth.post("/verify", rateLimit(20, 60_000), (req, res) => {
  const { pendingId, code } = req.body as { pendingId?: string; code?: string };
  const claims = pendingId ? readPending(pendingId) : null;
  if (!claims || claims.purpose !== "verify") return res.status(400).json({ error: "Verification session expired. Please sign in to get a new code." });
  if (!code || !/^\d{6}$/.test(code)) return res.status(400).json({ error: "Enter the 6-digit code.", field: "code" });

  const user = Users.findById(claims.sub);
  if (!user) return res.status(404).json({ error: "Account not found." });

  const result = verifyOtp(user.id, "verify", code);
  if (result === "ok") {
    Users.markVerified(user.id);
    const fresh = Users.findById(user.id)!;
    const payload: AuthResponse = { token: signSession(fresh), user: toUser(fresh) };
    return res.json(payload);
  }
  const messages: Record<string, string> = {
    invalid: "That code is not correct.",
    expired: "That code has expired. Request a new one.",
    locked: "Too many attempts. Request a new code.",
    none: "No active code. Request a new one.",
  };
  res.status(400).json({ error: messages[result], field: "code" });
});

/* ---------- resend ---------- */
auth.post("/resend", rateLimit(5, 60_000), async (req, res) => {
  const { pendingId, channel } = req.body as { pendingId?: string; channel?: OtpChannel };
  const claims = pendingId ? readPending(pendingId) : null;
  if (!claims) return res.status(400).json({ error: "Session expired. Please sign in again." });
  const user = Users.findById(claims.sub);
  if (!user) return res.status(404).json({ error: "Account not found." });
  const ch: OtpChannel = channel === "whatsapp" || channel === "email" ? channel : "sms";
  if (claims.purpose === "verify") {
    return res.json({ requiresVerification: true, ...(await sendVerification(user, ch)) });
  }
  const code = await issueOtp(user.id, "reset", "email", user.email);
  res.json({ pendingId: signPending(user.id, "reset"), channel: "email", maskedPhone: maskEmail(user.email), expiresIn: OTP_TTL_SECONDS, ...(IS_DEV ? { devCode: code } : {}) });
});

/* ---------- login ---------- */
auth.post("/login", rateLimit(15, 60_000), async (req, res) => {
  const body = req.body as { email?: string; password?: string };
  const errors = validateLogin(body);
  if (Object.keys(errors).length) {
    const [field, message] = Object.entries(errors)[0];
    return res.status(400).json({ error: message, field });
  }
  const user = Users.findByEmail(body.email!);
  const ok = user && (await bcrypt.compare(body.password!, user.password_hash));
  if (!ok) return res.status(401).json({ error: "Incorrect email or password." });
  if (!user!.verified) {
    return res.status(202).json({ requiresVerification: true, ...(await sendVerification(user!, "sms")) });
  }
  const payload: AuthResponse = { token: signSession(user!), user: toUser(user!) };
  res.json(payload);
});

/* ---------- forgot / reset ---------- */
auth.post("/forgot", rateLimit(5, 60_000), async (req, res) => {
  const email = String((req.body as { email?: string }).email ?? "").trim();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email address.", field: "email" });
  const user = Users.findByEmail(email);
  // Always respond the same way so emails cannot be enumerated.
  if (!user) return res.json({ sent: true, pendingId: null, maskedEmail: maskEmail(email), expiresIn: OTP_TTL_SECONDS });
  const code = await issueOtp(user.id, "reset", "email", user.email);
  res.json({
    sent: true, pendingId: signPending(user.id, "reset"), maskedEmail: maskEmail(user.email), expiresIn: OTP_TTL_SECONDS,
    ...(IS_DEV ? { devCode: code } : {}),
  });
});

auth.post("/reset", rateLimit(10, 60_000), async (req, res) => {
  const { pendingId, code, password } = req.body as { pendingId?: string; code?: string; password?: string };
  const claims = pendingId ? readPending(pendingId) : null;
  if (!claims || claims.purpose !== "reset") return res.status(400).json({ error: "Reset session expired. Start again." });
  if (!code || !/^\d{6}$/.test(code)) return res.status(400).json({ error: "Enter the 6-digit code.", field: "code" });
  if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters.", field: "password" });
  const user = Users.findById(claims.sub);
  if (!user) return res.status(404).json({ error: "Account not found." });
  const result = verifyOtp(user.id, "reset", code);
  if (result !== "ok") return res.status(400).json({ error: result === "invalid" ? "That code is not correct." : "Code expired. Request a new one.", field: "code" });
  Users.setPassword(user.id, await bcrypt.hash(password, 10));
  if (!user.verified) Users.markVerified(user.id);
  const fresh = Users.findById(user.id)!;
  const payload: AuthResponse = { token: signSession(fresh), user: toUser(fresh) };
  res.json(payload);
});

/* ---------- session ---------- */
auth.get("/me", requireAuth, (req, res) => {
  res.json({ user: toUser(currentUser(req)) });
});

auth.put("/me/apps", requireAuth, (req, res) => {
  const apps = (req.body as { apps?: unknown }).apps;
  if (!Array.isArray(apps) || !apps.every((a) => typeof a === "string" && isValidAppId(a))) {
    return res.status(400).json({ error: "Invalid app list." });
  }
  const user = currentUser(req);
  Users.setApps(user.id, [...new Set(apps as string[])]);
  res.json({ user: toUser(Users.findById(user.id)!) });
});

auth.patch("/me", requireAuth, (req, res) => {
  const u = currentUser(req);
  const b = req.body as Partial<{ firstName: string; lastName: string; company: string; phone: string; country: string; language: string }>;
  Users.updateProfile(u.id, {
    firstName: (b.firstName ?? u.first_name).trim() || u.first_name,
    lastName: (b.lastName ?? u.last_name).trim() || u.last_name,
    company: (b.company ?? u.company).trim() || u.company,
    phone: (b.phone ?? u.phone).trim() || u.phone,
    country: b.country ?? u.country,
    language: b.language ?? u.language,
  });
  res.json({ user: toUser(Users.findById(u.id)!) });
});

auth.post("/change-password", requireAuth, async (req, res) => {
  const u = currentUser(req);
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !(await bcrypt.compare(currentPassword, u.password_hash))) {
    return res.status(400).json({ error: "Current password is incorrect.", field: "currentPassword" });
  }
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters.", field: "newPassword" });
  Users.setPassword(u.id, await bcrypt.hash(newPassword, 10));
  res.json({ ok: true });
});
