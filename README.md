# Happify Backend

The Happify Backend is the API and data hub for Happify. It serves the web and mobile clients and coordinates authentication, mood tracking, journaling, AI companion requests, companion devices, anonymous community interactions, and professional-care workflows.

## Overview

The backend connects:

- Happify users with mood tracking, journaling, mindfulness, and motivation features
- The application with Happify AI for voice processing and journal analysis
- Web and mobile clients with PostgreSQL, Firebase, and S3-compatible object storage
- Users with psychologists and providers through referrals and care chat
- Companion devices with pairing, telemetry, mood sync, commands, and firmware metadata

The backend does not run AI models directly. AI processing is delegated to Happify AI through one shared service base URL.

## Technology Stack

| Area | Stack |
| --- | --- |
| Runtime | Node.js |
| Framework | Express 5, TypeScript |
| Database | PostgreSQL, Prisma |
| Authentication | Firebase Admin |
| Validation | Zod |
| Security | Helmet, CORS, request logging |
| Realtime | WebSocket |
| File Storage | S3-compatible object storage |
| AI Integration | Happify AI and an optional AI proxy |
| Testing | Node test runner and tsx |

## Features

- **Authentication** — Firebase token verification and user provisioning.
- **RBAC** — `USER`, `PSYCHOLOGIST`, `MODERATOR`, and `ADMIN` roles.
- **Mood Tracking** — Mood records and wellbeing history.
- **Daily Journaling** — Journal storage with optional AI reflection and risk analysis.
- **Voice Companion** — Voice-turn upload, transcript, response, mood, risk, and session history.
- **Mood Analytics** — Dashboard trends and voice-session mood patterns.
- **Consent Management** — Consent for AI, voice, emotion observations, and heatmap contributions.
- **Anonymous Community** — Anonymous posts, comments, support, reporting, and moderation workflows.
- **Anonymous Heatmap** — Coarse regional aggregates protected by a configurable anonymity threshold.
- **Professional Care** — Psychologist applications, referrals, and care chat.
- **Mindfulness and Motivation** — Published exercises and progress tracking.
- **Companion Devices** — Pairing, runtime credentials, telemetry, commands, firmware releases, and OTA metadata.
- **Media Upload** — Validated uploads to S3-compatible storage.
- **Realtime Updates** — Community, referral, care, and device-event broadcasts.

## API Routes

| Prefix | Description |
| --- | --- |
| `/health` | Backend health check |
| `/auth` | Authentication and user accounts |
| `/profile` | User profile |
| `/preferences` | User preferences |
| `/mood` | Mood tracking |
| `/journal` | Daily journals and AI journal analysis |
| `/voice` | Voice sessions, transcripts, and response audio |
| `/analytics` | Mood analytics and pattern summaries |
| `/motivation` | Personalized motivation |
| `/mindfulness` | Mindfulness content and progress |
| `/community` | Anonymous peer community and moderation |
| `/heatmap` | Anonymous aggregated mood heatmap |
| `/consents` | Consent management |
| `/referral` | Professional referrals and care chat |
| `/providers` | Professional provider directory |
| `/emergency-contacts` | Emergency contact management |
| `/notifications` | Push notifications and notification state |
| `/media` | Media upload and retrieval |
| `/devices` | Companion-device APIs |

## Environment Variables

Create `.env` from `.env.example`.

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
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. |
| `CORS_ORIGIN` | Allowed frontend origin or comma-separated origins. |
| `PUBLIC_API_URL` | Public backend URL for backend-generated links and assets. |
| `FIREBASE_PROJECT_ID` | Firebase project identifier. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin service-account JSON. |
| `AI_SERVICE_BASE_URL` | Single Happify AI base URL for voice and journal processing. |
| `AI_SERVICE_TOKEN` | Shared token used to authenticate backend-to-AI requests. |
| `S3_*` | Object-storage configuration for media. |
| `DEVICE_CLAIM_PEPPER` | Secret used to hash companion-device claim secrets. |
| `HEATMAP_K_ANONYMITY` | Minimum contribution count before a heatmap region is returned. |

Do not commit `.env`, Firebase credentials, service tokens, media-storage keys, or device secrets.

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- Firebase Admin credentials
- S3-compatible storage for media uploads
- Happify AI for voice and AI journal analysis

### Installation

```bash
npm install
```

### Database

```bash
npm run prisma:generate
npm run prisma:deploy
npm run seed
```

The seed is idempotent and provisions reference data plus representative demo data. Firebase seed-account passwords are created only when needed and printed once in the seed terminal output.

### Development

```bash
npm run dev
```

The default local server URL is `http://localhost:4000`.

### Build and Start

```bash
npm run build
npm start
```

### Verification

```bash
npx prisma format
npx prisma validate
npx prisma generate
npm test
npm run build
```

## Project Structure

```text
src
|-- config              # Prisma, Firebase, and application configuration
|-- generated           # Generated Prisma client
|-- modules
|   |-- analytics       # Dashboard and mood analytics
|   |-- auth            # Firebase authentication and RBAC
|   |-- community       # Anonymous community and moderation
|   |-- consent         # Consent management
|   |-- device          # Pairing, telemetry, commands, and OTA metadata
|   |-- journal         # Journals and AI journal adapter
|   |-- media           # Object-storage uploads
|   |-- mindfulness     # Mindfulness content
|   |-- mood            # Mood tracking
|   |-- motivation      # Daily motivation
|   |-- referral        # Professional referrals and care chat
|   |-- voice           # Voice processing and session history
|-- utils               # Request, AI, and shared utilities
|-- server.ts           # Express entry point
prisma
|-- schema.prisma       # Database schema
|-- migrations          # Database migrations
|-- seed.ts             # Reference and representative demo data
```

## Privacy and Safety

- Community public responses are sanitized to exclude internal user IDs, email addresses, and profiles.
- Heatmap responses contain only coarse aggregated regions that satisfy the anonymity threshold.
- The AI service is supportive and does not provide diagnosis or emergency care.
- Raw camera images are not accepted by device emotion-observation APIs.
