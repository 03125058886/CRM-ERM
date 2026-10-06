import { isValidAppId } from "./catalog";
import { COMPANY_SIZES, COUNTRIES, INTERESTS, LANGUAGES } from "./options";
import type { SignupPayload } from "./types";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;
export const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function validateSignup(p: Partial<SignupPayload>): FieldErrors<SignupPayload> {
  const e: FieldErrors<SignupPayload> = {};
  if (!p.firstName?.trim()) e.firstName = "First name is required";
  if (!p.lastName?.trim()) e.lastName = "Last name is required";
  if (!p.company?.trim()) e.company = "Company name is required";
  if (!p.subdomain || !SUBDOMAIN_RE.test(p.subdomain)) e.subdomain = "Use 3-40 lowercase letters, numbers or dashes";
  if (!p.email || !EMAIL_RE.test(p.email)) e.email = "Enter a valid email address";
  if (!p.phone || !PHONE_RE.test(p.phone)) e.phone = "Enter a valid phone number";
  if (!p.password || p.password.length < 8) e.password = "Password must be at least 8 characters";
  if (!p.country || !COUNTRIES.some((c) => c.id === p.country)) e.country = "Select your country";
  if (!p.language || !LANGUAGES.some((l) => l.id === p.language)) e.language = "Select a language";
  if (!p.companySize || !COMPANY_SIZES.some((s) => s.id === p.companySize)) e.companySize = "Select company size";
  if (!p.interest || !INTERESTS.some((i) => i.id === p.interest)) e.interest = "Select your primary interest";
  if (!Array.isArray(p.apps) || p.apps.length === 0) e.apps = "Pick at least one app";
  else if (p.apps.some((a) => !isValidAppId(a))) e.apps = "Unknown app selected";
  if (!p.acceptTerms) e.acceptTerms = "You must accept the terms";
  return e;
}

export function validateLogin(p: { email?: string; password?: string }): FieldErrors<{ email: string; password: string }> {
  const e: FieldErrors<{ email: string; password: string }> = {};
  if (!p.email || !EMAIL_RE.test(p.email)) e.email = "Enter a valid email address";
  if (!p.password) e.password = "Password is required";
  return e;
}
