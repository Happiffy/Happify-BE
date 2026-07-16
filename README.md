# Happify Backend

Backend API untuk Happify, platform kesehatan mental yang menangani autentikasi, mood tracking, journaling, AI Companion, device companion, analytics, referral profesional, dan penyimpanan data pengguna.

---

## Overview

BE-Happify menjadi pusat data dan API untuk frontend web, mobile app, dan AI Companion. Service ini menghubungkan:

- pengguna Happify dengan fitur mood dan journaling
- aplikasi dengan AI-Happify untuk voice transcription dan analisis jurnal
- aplikasi dengan perangkat Companion untuk pairing, telemetry, mood sync, dan command
- pengguna dengan psikolog atau provider melalui referral
- data aplikasi dengan PostgreSQL, Firebase, dan object storage

Backend tidak menjalankan model AI secara langsung. Pemrosesan AI diarahkan ke AI-Happify melalui satu base URL bersama.

---

## Tech Stack

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
| AI Integration | AI-Happify, optional AI proxy |
| Testing | Node test runner, tsx |
| Deployment | Railway |

---

## Features

- **Authentication** - Firebase token verification dan user session handling.
- **RBAC** - role `USER`, `PSYCHOLOGIST`, `MODERATOR`, dan `ADMIN`.
- **Mood Tracking** - pencatatan mood dan histori perkembangan pengguna.
- **Daily Journaling** - penyimpanan journal dengan optional AI reflection dan risk analysis.
- **Voice Companion** - upload voice turn ke AI-Happify, penyimpanan transcript, response, mood, risk, dan session ID.
- **Mood Analytics** - agregasi trend mood dan pola mood dari voice session.
- **Companion Pairing** - pairing device, runtime credential, heartbeat, telemetry, dan mood sync.
- **Device Commands** - haptic therapy, display message, configuration, restart, dan lifecycle command.
- **Firmware and OTA** - compatibility check, firmware release, dan deployment lifecycle.
- **Consent Management** - consent untuk AI processing, voice, emotion observation, dan heatmap.
- **Community** - post, comment, report, moderation, dan safe-space workflow.
- **Professional Referral** - referral ke psikolog, konselor, klinik, atau crisis line.
- **Mindfulness and Motivation** - konten mindfulness dan personalized motivation.
- **Media Upload** - validasi dan upload media melalui S3-compatible storage.
- **Realtime Updates** - broadcast update untuk care, referral, dan device events.

---

## API Routes

| Prefix | Description |
| --- | --- |
| `/health` | Health check backend |
| `/auth` | Authentication dan user account |
| `/profile` | User profile |
| `/preferences` | User preferences |
| `/mood` | Mood tracking |
| `/journal` | Daily journal dan AI journal analysis |
| `/voice` | Voice session, transcript, response audio |
| `/analytics` | Mood analytics dan pattern summary |
| `/motivation` | Personalized motivation |
| `/mindfulness` | Mindfulness content dan progress |
| `/community` | Peer community dan moderation |
| `/devices` | Companion device pairing dan runtime API |
| `/heatmap` | Anonymous mood heatmap |
| `/consents` | Consent management |
| `/referral` | Professional referral dan care chat |
| `/providers` | Professional provider directory |
| `/emergency-contacts` | Emergency contact management |
| `/notifications` | Push notification dan notification state |
| `/media` | Media upload dan retrieval |
| `/simulator` | Optional device simulator routes |

---

## Environment Variables

Buat file `.env` dari `.env.example`.

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/happify?schema=public
CORS_ORIGIN=http://localhost:5173
PUBLIC_API_URL=http://localhost:4000

FIREBASE_PROJECT_ID=happify-990c2
FIREBASE_SERVICE_ACCOUNT_JSON=

AI_SERVICE_BASE_URL=http://localhost:8000
AI_SERVICE_TOKEN=your_shared_ai_service_token
VOICE_UPSTREAM_TIMEOUT_MS=45000
AI_JOURNAL_TIMEOUT_MS=15000
VOICE_MAX_AUDIO_BYTES=6291456
VOICE_AUDIO_TTL_SECONDS=900

S3_ENDPOINT_URL=https://t3.storageapi.dev
S3_REGION=auto
S3_BUCKET_NAME=your_bucket_name
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key

DEVICE_CLAIM_PEPPER=your_random_secret
PAIRING_SESSION_TTL_SECONDS=300
DEVICE_CREDENTIAL_TTL_SECONDS=2592000
DEVICE_OBSERVATION_RETENTION_DAYS=30
HEATMAP_K_ANONYMITY=5
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string untuk Prisma. |
| `CORS_ORIGIN` | Origin FE yang diizinkan. Bisa berupa beberapa origin dipisahkan koma. |
| `PUBLIC_API_URL` | URL public BE untuk asset dan callback backend. |
| `FIREBASE_PROJECT_ID` | Firebase project ID Happify. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin service account JSON untuk production. |
| `AI_SERVICE_BASE_URL` | Satu-satunya URL AI-Happify untuk voice dan journal. Production: `https://happify-ai-production.up.railway.app`. |
| `AI_SERVICE_TOKEN` | Token yang harus sama persis dengan token pada AI-Happify. |
| `VOICE_UPSTREAM_TIMEOUT_MS` | Timeout request voice ke AI-Happify. |
| `AI_JOURNAL_TIMEOUT_MS` | Timeout request journal analysis ke AI-Happify. |
| `S3_*` | Konfigurasi object storage untuk media. |
| `DEVICE_CLAIM_PEPPER` | Secret untuk hashing claim secret device. |

Voice dan journal sengaja memakai satu `AI_SERVICE_BASE_URL`. Jangan menambahkan `AI_VOICE_BASE_URL` atau `AI_JOURNAL_BASE_URL` terpisah.

---

## Getting Started

### Prerequisites

- Node.js `22.x` atau versi yang sesuai dengan project
- npm
- PostgreSQL
- Firebase project dan Firebase Admin credentials
- S3-compatible bucket untuk upload media
- AI-Happify aktif jika ingin memakai voice atau AI journal analysis

### Installation

```bash
npm install
```

### Database

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### Development

```bash
npm run dev
```

Backend berjalan pada `http://localhost:4000` secara default.

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

---

## Verification

```bash
npx prisma format
npx prisma validate
npx prisma generate
npm test
npm run build
```

Migration database tidak dijalankan otomatis oleh verification command.

---

## Deployment

Production backend menggunakan Railway.

| Environment | URL |
| --- | --- |
| Local | `http://localhost:4000` |
| Production | `https://happify-be-production.up.railway.app` |
| AI Service | `https://happify-ai-production.up.railway.app` |

Railway melakukan deployment dari branch `main`. Set semua secret melalui Railway Variables dan jangan commit `.env` atau credential Firebase.

---

## Simulator

Simulator device hanya menguji HTTP software contract, bukan hardware fisik.

Aktifkan route simulator:

```env
ENABLE_SIMULATOR_ROUTES=true
```

Jalankan command:

```bash
npm run simulator:register
npm run simulator:telemetry
```

Simulator tidak memvalidasi BLE/Wi-Fi transport, MQTT QoS, camera hardware, haptic calibration, firmware flashing, atau power-loss recovery.

---

## Project Structure

```txt
src
|-- config              # Prisma, Firebase, dan konfigurasi aplikasi
|-- generated           # Generated Prisma client
|-- modules
|   |-- analytics       # Mood pattern dan dashboard analytics
|   |-- auth            # Firebase auth dan RBAC
|   |-- community       # Peer community dan moderation
|   |-- consent         # Consent management
|   |-- device          # Pairing, telemetry, command, dan OTA
|   |-- journal         # Journal dan AI journal adapter
|   |-- media           # Object storage upload
|   |-- mindfulness     # Mindfulness content
|   |-- mood            # Mood tracking
|   |-- motivation      # Daily motivation
|   |-- referral        # Professional referral dan care chat
|   |-- voice           # Voice transcription dan session history
|-- utils               # Request, AI, dan shared utilities
|-- server.ts           # Express entry point
prisma
|-- schema.prisma       # Database schema
|-- migrations          # Database migrations
```

---

## Service Architecture

```txt
Happify FE / Mobile
        |
        v
   BE-Happify
     |   |   \
     |   |    +--> PostgreSQL / Prisma
     |   +-------> Firebase Admin
     +-----------> S3-compatible Storage
        |
        v
   AI-Happify
```
