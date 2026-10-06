import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { User } from "@nexora/shared";

const DB_PATH = resolve(process.env.DB_PATH ?? "./data/nexora.db");
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL,
  company       TEXT NOT NULL,
  subdomain     TEXT NOT NULL UNIQUE,
  country       TEXT NOT NULL,
  language      TEXT NOT NULL,
  company_size  TEXT NOT NULL,
  interest      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  verified      INTEGER NOT NULL DEFAULT 0,
  apps          TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS otps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL,
  channel    TEXT NOT NULL,
  code_hash  TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS otps_user_purpose ON otps(user_id, purpose, used);
`);

export interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  subdomain: string;
  country: string;
  language: string;
  company_size: string;
  interest: string;
  password_hash: string;
  verified: number;
  apps: string;
  created_at: string;
}

export function toUser(r: UserRow): User {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    company: r.company,
    subdomain: r.subdomain,
    country: r.country,
    language: r.language,
    companySize: r.company_size,
    interest: r.interest,
    verified: r.verified === 1,
    apps: JSON.parse(r.apps) as string[],
    createdAt: r.created_at,
  };
}

const stmts = {
  byEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  byId: db.prepare("SELECT * FROM users WHERE id = ?"),
  bySubdomain: db.prepare("SELECT id FROM users WHERE subdomain = ?"),
  insert: db.prepare(`INSERT INTO users
    (first_name,last_name,email,phone,company,subdomain,country,language,company_size,interest,password_hash,apps)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`),
  setVerified: db.prepare("UPDATE users SET verified = 1 WHERE id = ?"),
  setApps: db.prepare("UPDATE users SET apps = ? WHERE id = ?"),
  setPassword: db.prepare("UPDATE users SET password_hash = ? WHERE id = ?"),
  updateProfile: db.prepare(`UPDATE users SET first_name=?, last_name=?, company=?, phone=?, country=?, language=? WHERE id = ?`),
};

export const Users = {
  findByEmail: (email: string) => stmts.byEmail.get(email.toLowerCase()) as UserRow | undefined,
  findById: (id: number) => stmts.byId.get(id) as UserRow | undefined,
  subdomainTaken: (s: string) => Boolean(stmts.bySubdomain.get(s)),
  create(d: {
    firstName: string; lastName: string; email: string; phone: string; company: string; subdomain: string;
    country: string; language: string; companySize: string; interest: string; passwordHash: string; apps: string[];
  }): UserRow {
    const r = stmts.insert.run(
      d.firstName, d.lastName, d.email.toLowerCase(), d.phone, d.company, d.subdomain,
      d.country, d.language, d.companySize, d.interest, d.passwordHash, JSON.stringify(d.apps),
    );
    return Users.findById(Number(r.lastInsertRowid))!;
  },
  markVerified: (id: number) => stmts.setVerified.run(id),
  setApps: (id: number, apps: string[]) => stmts.setApps.run(JSON.stringify(apps), id),
  setPassword: (id: number, hash: string) => stmts.setPassword.run(hash, id),
  updateProfile: (id: number, d: { firstName: string; lastName: string; company: string; phone: string; country: string; language: string }) =>
    stmts.updateProfile.run(d.firstName, d.lastName, d.company, d.phone, d.country, d.language, id),
};

const otpStmts = {
  invalidate: db.prepare("UPDATE otps SET used = 1 WHERE user_id = ? AND purpose = ? AND used = 0"),
  insert: db.prepare("INSERT INTO otps (user_id, purpose, channel, code_hash, expires_at) VALUES (?,?,?,?,?)"),
  latest: db.prepare("SELECT * FROM otps WHERE user_id = ? AND purpose = ? AND used = 0 ORDER BY id DESC LIMIT 1"),
  bumpAttempts: db.prepare("UPDATE otps SET attempts = attempts + 1 WHERE id = ?"),
  markUsed: db.prepare("UPDATE otps SET used = 1 WHERE id = ?"),
};

export interface OtpRow {
  id: number; user_id: number; purpose: string; channel: string; code_hash: string;
  attempts: number; expires_at: number; used: number; created_at: string;
}

export const Otps = {
  create(userId: number, purpose: string, channel: string, codeHash: string, expiresAt: number) {
    otpStmts.invalidate.run(userId, purpose);
    otpStmts.insert.run(userId, purpose, channel, codeHash, expiresAt);
  },
  latest: (userId: number, purpose: string) => otpStmts.latest.get(userId, purpose) as OtpRow | undefined,
  bumpAttempts: (id: number) => otpStmts.bumpAttempts.run(id),
  markUsed: (id: number) => otpStmts.markUsed.run(id),
};
