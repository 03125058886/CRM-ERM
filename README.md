# Nexora

All-in-one business apps. One login, one database, 46 integrated apps.
Monorepo with a **web app**, a **mobile app** and the **API** they share.

```
nexora/
├─ apps/
│  ├─ api/      Node 24 + Express 5 + SQLite (built-in node:sqlite) · JWT auth · OTP
│  ├─ web/      Next.js 16 · Tailwind v4 · Framer Motion · PWA manifest
│  └─ mobile/   Expo 57 (React Native) · expo-router · Reanimated 4 · SecureStore
└─ packages/
   └─ shared/   App catalog, countries, languages, brand tokens, validation, types
```

## Features

- **Trial page** – pick from 46 apps across 9 categories (search, animated selection, sticky bar), then sign up.
- **Signup** – name, company, auto-suggested `*.nexora.app` domain with live availability check, email, phone, password, country, language, company size, primary interest, terms.
- **Phone verification** – 6-digit OTP, resend via SMS / WhatsApp / Email with cooldown, attempt limits, 10-minute expiry.
- **Login / Logout** – unverified accounts are sent back to verification. Web keeps the JWT in an httpOnly cookie (never exposed to JS); mobile keeps it in SecureStore.
- **Forgot / reset password** – emailed code + new password.
- **Home menu** – Odoo-style launcher on a dotted canvas: Discuss, Calendar, Contacts, your installed apps, Dashboards, Apps, Settings.
- **Discuss** – channels (#general, #random, Notes to self, create your own) with a message thread and a small bot.
- **Calendar** – month grid, upcoming list, create / edit / delete events with colours.
- **Contacts** – people and companies with tags, search, kanban cards, create / edit / delete.
- **Apps** – app store: install / uninstall any of the 46 apps.
- **Settings** – profile, change password.
- **Dashboards** – Odoo-style named dashboards (`/dashboard/dashboards?dashboard_id=1…6`: Overview, Sales, Finance, Operations, People, Marketing) with KPI tiles, records-by-app and value-by-app bars, per-app stage charts, 14-day sparklines and top partners. App switcher in the top bar. Same on mobile.
- **App workspaces** – every one of the 46 apps opens its own workspace: kanban + list view, pipeline stages (e.g. CRM: New → Qualified → Proposition → Won/Lost), stats, search, create / edit / move / delete records. Seeded with demo data on first open. Same on mobile.
- **Rate limiting** on all auth endpoints. Password hashing with bcrypt.

## Quick start

Requirements: **Node 24+** (uses the built-in `node:sqlite`), npm 11+.

```bash
npm install
cp .env.example apps/api/.env      # optional – defaults work for local dev
npm run dev                        # API on :4000 + web on :3000
```

Open http://localhost:3000. In development the OTP code is printed in the API console **and** shown on the verify screen (“Dev mode · your code is …”). Set `NODE_ENV=production` to disable that.

### Mobile

```bash
npm run dev:mobile                 # starts Expo; press a (Android), i (iOS) or scan the QR with Expo Go
```

The mobile app auto-detects the API on your LAN (same host as the Metro bundler, port 4000).
Override with `EXPO_PUBLIC_API_URL`, e.g. for an Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000`.

### Scripts

| Command                | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | API + web in watch mode                        |
| `npm run dev:api`      | API only                                       |
| `npm run dev:web`      | Web only                                       |
| `npm run dev:mobile`   | Expo dev server                                |
| `npm run build`        | Bundle API (esbuild) + production web build    |
| `npm run typecheck`    | Type-check api, web and mobile                 |

## Sending real OTPs

The API prints codes to the console by default. To deliver them for real, set
`OTP_WEBHOOK_URL` (and optionally `OTP_WEBHOOK_TOKEN`). The API will `POST`
`{ channel, to, code, purpose }` as JSON to that URL. Point it at a tiny bridge that
calls Twilio / WhatsApp Cloud API / SendGrid.

## Environment variables

See `.env.example`. Important ones:

| Variable         | Where  | Purpose                                          |
| ---------------- | ------ | ------------------------------------------------ |
| `JWT_SECRET`     | api    | **Change in production.**                        |
| `DB_PATH`        | api    | SQLite file, default `./data/nexora.db`          |
| `CORS_ORIGIN`    | api    | Comma-separated allowed origins                  |
| `API_URL`        | web    | Where the Next.js proxy forwards (server-side)   |
| `EXPO_PUBLIC_API_URL` | mobile | API base URL for the app                    |

## API

| Method | Path                      | Notes                                   |
| ------ | ------------------------- | --------------------------------------- |
| GET    | `/health`                 |                                         |
| GET    | `/catalog`                | Apps & categories                        |
| GET    | `/meta`                   | Countries, languages, sizes, interests  |
| GET    | `/auth/check-subdomain`   | `?name=acme`                            |
| POST   | `/auth/signup`            | → `{ pendingId, maskedPhone, … }`       |
| POST   | `/auth/verify`            | `{ pendingId, code }` → `{ token, user }` |
| POST   | `/auth/resend`            | `{ pendingId, channel }`                |
| POST   | `/auth/login`             | 202 + pending if not verified           |
| POST   | `/auth/forgot`            | `{ email }`                             |
| POST   | `/auth/reset`             | `{ pendingId, code, password }`         |
| GET    | `/auth/me`                | Bearer                                  |
| PATCH  | `/auth/me`                | Update profile                          |
| PUT    | `/auth/me/apps`           | `{ apps: string[] }`                    |
| POST   | `/auth/change-password`   |                                         |
| GET    | `/apps/:appId/records`    | Workspace records (+ module definition) |
| POST   | `/apps/:appId/records`    | `{ title, stage, amount, partner, notes }` |
| PATCH  | `/records/:id`            | Partial update (e.g. `{ stage }`)       |
| DELETE | `/records/:id`            |                                         |
| GET    | `/dashboards/summary`     | Aggregates for every installed app      |
| GET/POST | `/discuss/channels`     | Channels (seeded on first use)          |
| GET/POST | `/discuss/channels/:id/messages` | Thread + send                  |
| GET/POST | `/calendar/events`      | `?from&to` · create                     |
| PATCH/DELETE | `/calendar/events/:id` |                                      |
| GET/POST | `/contacts`             |                                         |
| PATCH/DELETE | `/contacts/:id`     |                                         |

## Brand

Primary **#5B4BFF** (electric indigo) · Accent **#FF6B4A** (coral) · Mint **#22D3A5** · Midnight **#0B0F2A**.
Tokens live in `packages/shared/src/brand.ts` and are consumed by both apps.
