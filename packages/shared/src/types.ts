export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  subdomain: string;
  country: string;
  language: string;
  companySize: string;
  interest: string;
  verified: boolean;
  apps: string[];
  createdAt: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  company: string;
  subdomain: string;
  email: string;
  phone: string;
  password: string;
  country: string;
  language: string;
  companySize: string;
  interest: string;
  apps: string[];
  acceptTerms: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PendingVerification {
  pendingId: string;
  channel: "sms" | "whatsapp" | "email";
  maskedPhone: string;
  expiresIn: number;
  /** only returned when API runs in dev mode */
  devCode?: string;
}

export interface ApiError {
  error: string;
  field?: string;
}
