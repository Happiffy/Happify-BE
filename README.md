<div align="center">

# ☁️ Happify-Backend — API & Data Hub

### *Detect Early. Support Meaningfully. Grow for Life.*

[![Runtime](https://img.shields.io/badge/Runtime-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/Framework-Express%205-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Language](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Auth](https://img.shields.io/badge/Auth-Firebase%20Admin-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Validation](https://img.shields.io/badge/Validation-Zod-3E67B1?style=flat-square)](https://zod.dev/)
[![Realtime](https://img.shields.io/badge/Realtime-WebSocket-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![License](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)](../LICENSE)
[![Hackathon](https://img.shields.io/badge/Garuda%20Hacks%207.0-2026-FFD21E?style=flat-square)](https://garudahacks.com/)

<br/>

**The API and data hub of Happify — a Node.js/Express backend that authenticates users, stores every wellbeing signal, orchestrates AI journal and voice analysis, powers an anonymous community and heatmap, routes professional care, and streams it all to web, mobile, and companion-device clients in real time.**

[🌐 Frontend](https://github.com/Happiffy/Happify-FE) · [☁️ Backend](https://github.com/Happiffy/Happify-BE) · [🧠 AI](https://github.com/Happiffy/Happify-AI) · [📱 Mobile](https://github.com/Happiffy/Happify-Mobile) · [🔌 IoT](https://github.com/Happiffy/Happify-IOT)

</div>

---

## 📌 Overview

Happify-Backend is the **single source of truth** of the Happify ecosystem. Every client — the web dashboard, the mobile app, and the companion IoT device — reads and writes through this API. It owns the PostgreSQL schema, verifies Firebase identities, enforces role-based access, delegates AI reasoning to **Happify-AI**, stores media in S3-compatible object storage, and fans out live updates over WebSockets.

> **Happify-Backend's role in the ecosystem:**
> *"The nervous system — every signal a user, a device, or an AI model produces passes through here to be verified, persisted, and routed to whoever needs to see it next."*

The backend does **not** run AI models itself. Voice processing and journal analysis are delegated to **Happify-AI** through a single shared service base URL and bearer token — the backend's job is orchestration, safety policy, and persistence, not inference.

| | |
|---|---|
| **Runtime** | Node.js (ESM) + tsx |
| **Framework** | Express 5 + TypeScript |
| **Database** | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| **Auth** | Firebase Admin SDK (ID-token verification) + RBAC |
| **Validation** | Zod schemas on every route |
| **Realtime** | Raw `ws` WebSocket server, channel-based pub/sub |
| **Storage** | S3-compatible object storage (`@aws-sdk/client-s3`) |
| **AI Integration** | HTTP calls to Happify-AI (journal + voice) |
| **API Docs** | OpenAPI JSON + Swagger UI at `/docs` |

---

## 🌐 Happify Ecosystem

Happify-Backend sits at the **center** of the platform — the frontend, mobile app, and IoT companion device all depend on it, and it in turn depends on Happify-AI for reasoning and Firebase/PostgreSQL/S3 for identity, data, and media.

| Repository | Role | Link |
|---|---|---|
| 🌐 **Happify-FE** | Web dashboard — mood, journal, community, care | [Happiffy/Happify-FE](https://github.com/Happiffy/Happify-FE) |
| ☁️ **Happify-BE** | Node.js API, PostgreSQL, Firebase, WebSocket hub *(this repo)* | [Happiffy/Happify-BE](https://github.com/Happiffy/Happify-BE) |
| 🧠 **Happify-AI** | FastAPI service — journal reflection, risk detection, voice processing | [Happiffy/Happify-AI](https://github.com/Happiffy/Happify-AI) |
| 📱 **Happify-Mobile** | Flutter app for mood tracking, journaling, and care access on the go | [Happiffy/Happify-Mobile](https://github.com/Happiffy/Happify-Mobile) |
| 🔌 **Happify-IOT** | ESP32-class voice-companion device paired to a user account | [Happiffy/Happify-IOT](https://github.com/Happiffy/Happify-IOT) |

**System architecture:**

```mermaid
graph TD
    FE["🌐 Happify-Frontend"] -->|REST + WebSocket| BE["☁️ Happify-Backend (this repo)"]
    MB["📱 Happify-Mobile"] -->|REST + WebSocket| BE
    IOT["🔌 Happify-IOT device"] -->|Device-token REST + audio| BE

    BE --> PG[("🗄️ PostgreSQL via Prisma")]
    BE --> FB["🔥 Firebase Admin (auth)"]
    BE --> S3[("📦 S3-compatible storage")]
    BE -->|"journal / voice analysis"| AI["🧠 Happify-AI"]
    AI -->|"risk level + reflection / audio"| BE
    BE -->|WebSocket broadcast| FE
    BE -->|WebSocket broadcast| MB

    style BE fill:#1CB0F6,color:#fff,stroke:#168CC7
    style AI fill:#CE82FF,color:#fff,stroke:#A760D2
    style FE fill:#58CC02,color:#fff,stroke:#46A302
    style MB fill:#58CC02,color:#fff,stroke:#46A302
    style IOT fill:#FF9600,color:#fff,stroke:#D97A00
```

**Principles this backend is built around:**

- **Privacy by design** — Public community responses strip internal user IDs, emails, and profile data; heatmap results only ever return coarse, k-anonymous regions.
- **Safety first** — AI output is supportive, not diagnostic. High-risk signals become explicit `Referral` records reviewed by a human, not automated actions.
- **Human support matters** — Accepted referrals open a `CareChatSession` connecting a user directly to a verified psychologist.
- **Least privilege** — Every route is gated by Firebase-verified identity plus role (`USER` / `PSYCHOLOGIST` / `MODERATOR` / `ADMIN`), and device endpoints use a separate, scoped device-credential system.
- **Secure operations** — Service-account JSON, database URLs, AI tokens, S3 keys, and device pepper secrets are all environment-only and never committed.

---

## ✨ Features

- 🔐 **Authentication & RBAC** — Firebase ID-token verification on every request, with `USER`, `PSYCHOLOGIST`, `MODERATOR`, and `ADMIN` roles enforced via `requireAuth`/`requireRole` middleware.
- 😊 **Mood Tracking** — Timestamped mood check-ins (state, intensity, triggers, notes) feeding the analytics dashboard.
- 📓 **Daily Journaling** — Journal entries enriched by Happify-AI with a detected mood, a `LOW`/`MEDIUM`/`HIGH`/`CRISIS` risk level, and a short supportive reflection.
- 🎙️ **Voice Companion** — Uploads raw audio to Happify-AI, stores the transcript/response/mood/risk per turn, and streams the generated speech back for playback.
- 📊 **Analytics** — Aggregated dashboard totals, mood-intensity trends, and journal risk-level summaries per user.
- 📝 **Consent Management** — Versioned consent documents and per-user acceptance for AI processing, voice processing, device emotion observation, and heatmap contribution.
- 🫂 **Anonymous Community** — Alias-based posts and comments, support reactions, reporting, and a moderator audit trail (hide/restore/resolve/dismiss).
- 🗺️ **Anonymous Heatmap** — Daily mood contributions bucketed into coarse geo-regions, only surfaced once a region reaches the configured k-anonymity threshold (`max(3, HEATMAP_K_ANONYMITY)`, default 5).
- 🤝 **Professional Care** — Psychologist verification applications, referral requests with a captured background snapshot, referral review, and 1:1 care-chat sessions.
- 🧘 **Mindfulness & Motivation** — Published breathing/meditation/grounding exercises with per-user progress, plus locale-aware daily motivation messages.
- 🔌 **Companion Devices** — Claim-secret pairing, scoped runtime credentials, telemetry ingestion, remote commands, and OTA firmware metadata for the IoT companion.
- 📎 **Media Upload** — Validated image uploads proxied to S3-compatible object storage.
- 🔔 **Push Notifications** — FCM token registration and per-user notification preference toggles.
- ⚡ **Realtime Broadcasts** — A single WebSocket hub fans out community, referral, care-chat, and device events to authorized subscribers only.
- 📚 **Self-Documenting API** — Full OpenAPI spec served at `/openapi.json`, with an interactive Swagger UI at `/docs`.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js (ESM) + `tsx` | Fast TypeScript execution without a separate build step in dev |
| **Framework** | Express 5 | HTTP routing and middleware pipeline |
| **Language** | TypeScript ~6.0 | End-to-end type safety across modules |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` | Type-safe PostgreSQL access, migrations, and seeding |
| **Database** | PostgreSQL | Primary relational data store |
| **Authentication** | `firebase-admin` | Verifies client Firebase ID tokens server-side |
| **Validation** | Zod | Request/response schema validation across every module |
| **Security** | Helmet, CORS (origin allow-list) | HTTP security headers and cross-origin control |
| **Logging** | Morgan | Request logging (`dev` locally, `combined` in production) |
| **Realtime** | `ws` | Raw WebSocket server with an authenticated pub/sub channel model |
| **Object Storage** | `@aws-sdk/client-s3` | S3-compatible media upload/retrieval |
| **Sanitization** | `sanitize-html` | Strips unsafe markup from rich-text journal/community content |
| **API Docs** | `swagger-ui-express` | Interactive docs generated from `src/config/openapi.ts` |
| **Testing** | Node's built-in test runner via `tsx --test` | Unit tests for utils, voice validation, analytics, device firmware logic |

---

## 📁 Project Structure

```text
Happify-BE/
├── prisma/
│   ├── schema.prisma           # Full data model (30+ models, see Data Model below)
│   ├── migrations/             # Timestamped SQL migrations
│   └── seed.ts                 # Idempotent reference + demo data seeding
│
├── src/
│   ├── server.ts                # Express app entry point, route mounting, WS attach
│   │
│   ├── config/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── firebase.ts           # Firebase Admin initialization
│   │   └── openapi.ts            # OpenAPI document served at /openapi.json and /docs
│   │
│   ├── generated/prisma/         # Generated Prisma Client (do not edit)
│   │
│   ├── modules/                  # One folder per domain, each with the same shape:
│   │   │                         #   *.routes.ts → *.controller.ts → *.service.ts → *.repository.ts
│   │   │                         #   plus *.validation.ts (Zod schemas)
│   │   ├── auth/                 # Firebase verification, RBAC middleware
│   │   ├── profile/               # User profile read/update
│   │   ├── preference/            # Onboarding + accessibility + notification preferences
│   │   ├── mood/                  # Mood check-ins
│   │   ├── journal/                # Journals + journal.client.ts (Happify-AI adapter)
│   │   ├── voice/                  # Voice turns + voice.client.ts (Happify-AI adapter)
│   │   ├── analytics/              # Dashboard aggregation
│   │   ├── consent/                 # Consent documents and user consent state
│   │   ├── community/               # Posts, comments, support, reports, moderation
│   │   ├── heatmap/                  # K-anonymous mood aggregation
│   │   ├── referral/                  # Referrals + care-chat sessions/messages
│   │   ├── provider/                   # Professional provider directory
│   │   ├── emergency-contact/          # Emergency contact CRUD
│   │   ├── mindfulness/                 # Mindfulness content + progress
│   │   ├── motivation/                   # Daily motivation messages
│   │   ├── notification/                  # FCM tokens + notification preferences
│   │   ├── media/                          # S3 upload/retrieval
│   │   ├── device/                          # Pairing, telemetry, commands, OTA, runtime auth
│   │   └── realtime/realtime.ts              # WebSocket server, channels, broadcast()
│   │
│   └── utils/                    # ai.util.ts, html.util.ts (sanitization), request.util.ts
│
├── VOICE_IOT_CONTRACT.md          # Firmware-facing contract for the IoT voice companion
├── prisma.config.ts
├── tsconfig.json
├── .env.example
└── package.json
```

Every module follows the same layered convention: **routes** (Express `Router`, wires middleware) → **controller** (parses `req`, calls service, shapes `res`) → **service** (business logic, calls the AI client where relevant) → **repository** (Prisma queries), with **validation** as shared Zod schemas.

---

## ⚙️ How the API Works

**Authentication on every request:**

```mermaid
sequenceDiagram
    participant C as Client (FE / Mobile)
    participant BE as Happify-BE
    participant FB as Firebase Admin
    participant DB as PostgreSQL

    C->>BE: Request with "Authorization: Bearer <Firebase ID token>"
    BE->>FB: verifyIdToken(token)
    FB-->>BE: decoded { uid }
    BE->>DB: findUnique MsUser by firebaseUid
    DB-->>BE: { id, role }
    alt user found & role valid
        BE-->>C: 200 — proceeds to controller
    else missing / invalid
        BE-->>C: 401 UNAUTHENTICATED
    end
```

**Journal creation with AI-assisted risk detection:**

```mermaid
sequenceDiagram
    participant U as User (via Frontend)
    participant BE as Happify-BE
    participant AI as Happify-AI
    participant DB as PostgreSQL

    U->>BE: POST /journal { title, content }
    BE->>AI: POST /api/analyze-journal { content, language }
    AI-->>BE: { reflection, emotion.state, risk_policy.severity }
    Note over BE: On AI timeout/failure, journal is still saved (riskLevel defaults to LOW)
    BE->>DB: Insert TrJournalEntry (detectedMood, riskLevel, aiReflection)
    DB-->>BE: Saved journal
    BE-->>U: 201 { journal }
```

**Realtime channel model** (`src/modules/realtime/realtime.ts`):

```mermaid
flowchart LR
    S[WebSocket connects] -->|"{ type: 'auth', token }"| V[verify Firebase token]
    V --> J["{ type: 'subscribe', channel }"]
    J --> A{authorizeChannel}
    A -->|"community"| OK1[Anyone authenticated]
    A -->|"care"| OK2["PSYCHOLOGIST / ADMIN only"]
    A -->|"user:&lt;id&gt;:care"| OK3[Only that user]
    A -->|"care-chat:&lt;sessionId&gt;"| OK4[Only session participants]
    OK1 & OK2 & OK3 & OK4 --> B[broadcast on domain events]
```

Community posts/comments, referral status changes, care-chat messages/typing/read-receipts, and device command acknowledgements are all pushed through `broadcast(channel, payload)` to every authorized socket in that channel — no polling required on the client side.

---

## 🗄️ Data Model

The schema (`prisma/schema.prisma`) uses a **`Ms`/`Tr`** naming convention — **`Ms`** (master) tables for reference/identity data, **`Tr`** (transaction) tables for user-generated activity — spanning 30+ models. Core relationships:

```mermaid
erDiagram
    MsUser ||--o{ TrMoodEntry : logs
    MsUser ||--o{ TrJournalEntry : writes
    MsUser ||--o{ TrCommunityPost : posts
    MsUser ||--o{ TrReferral : requests
    MsUser ||--o| MsUserPreference : has
    MsUser ||--o| TrPsychologistApplication : "applies as"
    MsUser ||--o{ MsDevice : owns

    TrReferral ||--o| TrCareChatSession : opens
    TrCareChatSession ||--o{ TrCareChatMessage : contains
    TrCommunityPost ||--o{ TrCommunityComment : has
    TrCommunityPost ||--o{ TrCommunitySupport : receives
    TrCommunityPost ||--o{ TrCommunityReport : "can be"

    MsDevice ||--o{ TrDeviceTelemetry : reports
    MsDevice ||--o{ TrDeviceCommand : receives
    MsDevice ||--o{ TrDeviceEmotionObservation : produces
    MsDevice ||--o{ TrDevicePairingSession : "paired via"
    MsDevice ||--o{ TrDeviceOtaDeployment : updates

    MsUser ||--o{ TrUserConsent : grants
    MsConsentDocument ||--o{ TrUserConsent : versions
```

**Key enums:** `MoodState` (HAPPY / CALM / NEUTRAL / ANXIOUS / SAD / DISTRESSED), `RiskLevel` (LOW / MEDIUM / HIGH / CRISIS), `ReferralStatus`, `ChatSessionStatus`, `DeviceStatus`, `DeviceCommandType`, `ConsentScope`.

---

## 🔌 API Routes

All routes are mounted in `src/server.ts`. Full interactive documentation is available at **`/docs`** (Swagger UI) and **`/openapi.json`** once the server is running.

| Prefix | Description |
|---|---|
| `GET /health` | Backend health check |
| `POST /auth/verify` | Exchange a Firebase ID token for a Happify user session |
| `/profile` | User profile read/update |
| `/preferences` | Onboarding, accessibility, and notification preferences |
| `/mood` | Mood check-ins |
| `/journal` | Journals with AI-assisted reflection and risk level |
| `/voice` | Voice-turn upload, transcript, response audio, session history |
| `/analytics` | Dashboard aggregation and mood-pattern summaries |
| `/motivation` | Locale-aware daily motivation |
| `/mindfulness` | Mindfulness content and per-user progress |
| `/community` | Anonymous posts, comments, support, reports, moderation |
| `/heatmap` | Anonymous, k-anonymous mood heatmap |
| `/consents` | Consent documents and consent status |
| `/referral` | Referrals, psychologist review, and care-chat sessions/messages |
| `/providers` | Professional provider directory |
| `/emergency-contacts` | Emergency contact management |
| `/notifications` | FCM token registration and notification preferences |
| `/media` | Image upload to S3-compatible storage |
| `/devices` | Pairing, credentials, telemetry, commands, firmware/OTA (`/devices/runtime/*` uses device-token auth, not Firebase) |
| `WS /ws` | Realtime channel subscription (`community`, `care`, `user:<id>:care`, `care-chat:<sessionId>`) |

> The `/voice` router is mounted **before** the global `express.json()` body parser (see `server.ts`) so it can accept raw binary audio uploads; everything else uses JSON.

---

## 🔐 Environment Variables

Create `.env` from `.env.example`:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/happify?schema=public
CORS_ORIGIN=http://localhost:5173
PUBLIC_API_URL=http://localhost:4000

FIREBASE_PROJECT_ID=happify-990c2
FIREBASE_SERVICE_ACCOUNT_JSON=

AI_SERVICE_BASE_URL=http://localhost:8000
AI_SERVICE_TOKEN=
VOICE_UPSTREAM_TIMEOUT_MS=45000
AI_JOURNAL_TIMEOUT_MS=15000
VOICE_MAX_AUDIO_BYTES=6291456
VOICE_AUDIO_TTL_SECONDS=900

S3_ENDPOINT_URL=
S3_REGION=auto
S3_BUCKET_NAME=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

DEVICE_CLAIM_PEPPER=
PAIRING_SESSION_TTL_SECONDS=300
DEVICE_CREDENTIAL_TTL_SECONDS=2592000
DEVICE_OBSERVATION_RETENTION_DAYS=30
HEATMAP_K_ANONYMITY=5
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `PUBLIC_API_URL` | Public backend URL used in backend-generated links/assets |
| `FIREBASE_PROJECT_ID` / `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin project + service-account credentials |
| `AI_SERVICE_BASE_URL` / `AI_SERVICE_TOKEN` | Single Happify-AI base URL and bearer token for voice + journal processing |
| `VOICE_UPSTREAM_TIMEOUT_MS` / `AI_JOURNAL_TIMEOUT_MS` | Timeouts for the two AI integrations |
| `VOICE_MAX_AUDIO_BYTES` / `VOICE_AUDIO_TTL_SECONDS` | Voice upload size cap and generated-audio retention |
| `S3_*` | Object-storage endpoint, region, bucket, and credentials for media |
| `DEVICE_CLAIM_PEPPER` | Secret used to hash companion-device claim secrets |
| `PAIRING_SESSION_TTL_SECONDS` / `DEVICE_CREDENTIAL_TTL_SECONDS` | Device pairing-session and runtime-credential lifetimes |
| `DEVICE_OBSERVATION_RETENTION_DAYS` | Retention window for device emotion observations |
| `HEATMAP_K_ANONYMITY` | Minimum unique contributors before a heatmap region is returned (floored at 3) |

> ⚠️ Never commit `.env`, Firebase service-account JSON, AI service tokens, S3 keys, or the device claim pepper.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database
- Firebase Admin service-account credentials
- S3-compatible storage credentials (for media uploads)
- A running **Happify-AI** instance (for voice + journal analysis)

### Installation

```bash
git clone https://github.com/Happiffy/Happify-BE.git
cd Happify-BE
npm install
cp .env.example .env   # then fill in database, Firebase, AI, and S3 credentials
```

### Database

```bash
npm run prisma:generate
npm run prisma:deploy
npm run seed
```

The seed script is idempotent — safe to re-run — and provisions reference data plus representative demo data. Firebase seed-account passwords are generated only when needed and printed once to the terminal.

### Development

```bash
npm run dev
```

The server starts at `http://localhost:4000`. Explore the API interactively at `http://localhost:4000/docs`.

### Build & Start

```bash
npm run build   # tsc --noEmit (type-check only)
npm start        # runs prisma migrate deploy, then starts the server
```

### Quality Checks

```bash
npx prisma format
npx prisma validate
npm test         # Node test runner across utils, voice, analytics, device modules
npm run build
```

---

## 🎓 Project Context

<div align="center">

Built for

### **Garuda Hacks 7.0 — International Hackathon Competition**

*AI-Powered Mental Wellness Platform*

</div>

Happify-Backend is the **API and data hub** of **Happify**, a privacy-aware digital wellbeing ecosystem built around early detection, meaningful support, and lifelong emotional growth:

| Layer | Component | Role |
|---|---|---|
| 🌐 **Web** | [Happify-FE](https://github.com/Happiffy/Happify-FE) | Mood tracking, journaling, anonymous community, care workflows |
| ☁️ **Backend** | **Happify-BE** *(this repo)* | API, PostgreSQL, Firebase, WebSocket hub, safety & moderation |
| 🧠 **AI** | [Happify-AI](https://github.com/Happiffy/Happify-AI) | Journal reflection, risk detection, voice processing |
| 📱 **Mobile** | [Happify-Mobile](https://github.com/Happiffy/Happify-Mobile) | Flutter app for on-the-go mood tracking and care access |
| 🔌 **IoT** | [Happify-IOT](https://github.com/Happiffy/Happify-IOT) | Voice-companion device paired to a user account |

---

## 👥 Team

<div align="center">

**Outstanding BINUSIAN Team — Garuda Hacks 7.0**

| Name | Role |
|---|---|
| **Andrian Pratama** | Full-stack Developer |
| **Khalisa Amanda Sifa Ghaizani** | IoT Engineer |
| **Michella Arlene Wijaya Radika** | Product Developer |
| **Stanley Nathanael Wijaya** | Product Developer |

</div>

---

## 📄 License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

```
MIT License

Copyright (c) 2026 Happify — Garuda Hacks 7.0

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.
```

<br/>

*"Detect early. Support meaningfully. Grow for life."*

<br/>

[![Garuda Hacks](https://img.shields.io/badge/Garuda%20Hacks%207.0-International%20Hackathon-FFD21E?style=for-the-badge)](https://garudahacks.com/)

<br/>
Made with 🌱 for Garuda Hacks 7.0

</div>