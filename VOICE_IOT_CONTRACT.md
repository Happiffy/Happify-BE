# Happify Voice Companion IoT — Hackathon Context

Dokumen ini adalah context lengkap untuk firmware IoT Voice Companion demo. Device dipair khusus ke akun demo **Nanda Pratama** dan berbicara ke backend Happify.

## Tujuan device

Device harus bisa:

1. Terhubung ke Wi‑Fi.
2. Merekam suara pengguna dari mikrofon.
3. Mengirim audio ke Happify AI melalui backend.
4. Menerima respons AI berupa teks + MP3.
5. Memutar MP3 respons otomatis melalui speaker.
6. Melanjutkan sesi aktif atau membuat sesi baru lewat tombol fisik.
7. Menampilkan error/koneksi/safety state pada display/LED.

Device tidak perlu:

- Firebase SDK.
- Login email/password.
- Mengetahui ID database Nanda secara hardcode.
- Menyimpan riwayat chat.
- Mengirim transcript atau audio ke log serial produksi.

## Prasyarat backend

```bash
cd Happify-BE
npm run seed
npm run provision:iot:nanda
```

Perintah kedua membuat file lokal berikut:

```text
Happify-BE/.secrets/nanda-voice-companion-context.h
```

File ini sudah dibuat pada environment saat ini. Isinya adalah credential nyata yang diperlukan firmware:

```cpp
#pragma once

#define HAPPIFY_API_BASE_URL "..."
#define HAPPIFY_DEVICE_RUNTIME_TOKEN "..."
#define HAPPIFY_USER_ID "..."
#define HAPPIFY_USER_NAME "Nanda Pratama"
#define HAPPIFY_DEVICE_ID "..."
#define HAPPIFY_DEVICE_SERIAL "HAPPIFY-NANDA-VOICE-001"
#define HAPPIFY_VOICE_TURN_ENDPOINT "/devices/runtime/voice/turns"
#define HAPPIFY_VOICE_AUDIO_TEMPLATE "/devices/runtime/voice/turns/{turnId}/audio"
#define HAPPIFY_VOICE_LANGUAGE "id"
#define HAPPIFY_DEVICE_TOKEN_EXPIRES_AT "..."
```

Copy file tersebut ke private include folder firmware, misalnya:

```text
firmware/include/nanda-voice-companion-context.h
```

File `.secrets/` di-ignore Git. Jangan commit header hasil generate, jangan menaruh token dalam prompt, screenshot, log serial, atau source code public.

Setiap menjalankan `npm run provision:iot:nanda`:

- token lama device Nanda dicabut;
- satu token baru dibuat;
- header firmware diperbarui;
- token default berlaku 30 hari.

## Konfigurasi Wi‑Fi firmware

Buat file lokal terpisah `wifi-secrets.h`:

```cpp
#pragma once

#define WIFI_SSID "<WIFI_SSID>"
#define WIFI_PASSWORD "<WIFI_PASSWORD>"
```

Jangan commit file ini. Firmware harus reconnect dengan exponential backoff jika Wi‑Fi putus.

## Firmware include

```cpp
#include "wifi-secrets.h"
#include "nanda-voice-companion-context.h"
```

## Authentication

Semua endpoint runtime memakai header **Device**, bukan Bearer:

```http
Authorization: Device <HAPPIFY_DEVICE_RUNTIME_TOKEN>
```

Backend mengidentifikasi device dari token tersebut, lalu otomatis menggunakan owner device sebagai user. Untuk device seed, owner-nya adalah Nanda Pratama.

Firmware tidak perlu mengirim `userId` ke request Voice.

## Boot flow

Saat boot:

```text
1. Mulai display/LED/speaker/mic.
2. Sambungkan Wi‑Fi.
3. Request runtime context.
4. Jika context valid dan voice consent aktif, device masuk state READY.
5. Jika token invalid, tampilkan TOKEN EXPIRED dan minta provision ulang.
6. Jika voice consent belum aktif, tampilkan VOICE CONSENT REQUIRED.
```

### Request runtime context

```http
GET /devices/runtime/context
Authorization: Device <HAPPIFY_DEVICE_RUNTIME_TOKEN>
```

### Response runtime context

```json
{
  "status": "success",
  "data": {
    "context": {
      "device": {
        "id": "device-id",
        "serialNumber": "HAPPIFY-NANDA-VOICE-001",
        "model": "Happify Voice Companion",
        "displayName": "Nanda Voice Companion",
        "status": "PAIRED"
      },
      "user": {
        "id": "nanda-user-id",
        "displayName": "Nanda Pratama"
      },
      "voice": {
        "language": "id",
        "voiceConsentAccepted": true,
        "maxAudioBytes": 6291456,
        "allowedContentTypes": [
          "audio/wav",
          "audio/x-wav",
          "audio/mpeg",
          "audio/mp4",
          "audio/webm",
          "audio/ogg"
        ],
        "turnEndpoint": "/devices/runtime/voice/turns",
        "audioEndpointTemplate": "/devices/runtime/voice/turns/{turnId}/audio"
      }
    }
  }
}
```

Simpan `context.voice` di RAM. `HAPPIFY_USER_ID` pada header firmware hanya untuk label/debug offline, bukan request payload.

## Audio recording

Rekomendasi hackathon:

```text
Format: WAV PCM
Sample rate: 16 kHz
Channels: mono
Bits per sample: 16-bit
Maksimal: 6 MiB
```

Jangan upload audio kurang dari 1.000 bytes. Gunakan tombol fisik:

```text
Tekan dan tahan MIC: mulai rekam
Lepas MIC: stop rekam lalu kirim
Tekan NEW SESSION: mulai sesi baru
Tekan STOP: hentikan audio AI yang sedang diputar
```

## Kirim voice turn

```http
POST /devices/runtime/voice/turns
Authorization: Device <HAPPIFY_DEVICE_RUNTIME_TOKEN>
Content-Type: audio/wav
X-Voice-Language: id
X-Session-Id: nanda-session-001
Idempotency-Key: iot-voice-000001

<raw WAV binary bytes>
```

### Header

| Header | Nilai |
| --- | --- |
| `Authorization` | `Device <HAPPIFY_DEVICE_RUNTIME_TOKEN>` |
| `Content-Type` | `audio/wav` |
| `X-Voice-Language` | `id` |
| `X-Session-Id` | sesi aktif saat ini |
| `Idempotency-Key` | unik untuk setiap rekaman |

### Idempotency key

Gunakan counter persistent di NVS:

```text
iot-voice-1
iot-voice-2
iot-voice-3
```

Jika request gagal karena Wi‑Fi putus dan firmware tidak menerima respons HTTP, retry audio yang sama memakai idempotency key yang sama. Rekaman baru harus memakai key baru.

## Voice response

```json
{
  "status": "success",
  "data": {
    "turn": {
      "id": "voice-turn-id",
      "sessionId": "nanda-session-001",
      "transcript": "Saya sedang merasa cemas.",
      "responseText": "Terima kasih sudah cerita. Mari tarik napas perlahan bersama.",
      "detectedMood": "ANXIOUS",
      "emotionConfidence": 0.91,
      "riskLevel": "LOW",
      "audioUrl": "/voice/turns/voice-turn-id/audio",
      "audioExpiresAt": "2026-07-17T12:20:00.000Z"
    }
  }
}
```

Firmware harus:

1. Tampilkan `responseText` di display, jika ada.
2. Jika `riskLevel` adalah `LOW` atau `MEDIUM` dan `audioUrl` tersedia, download lalu autoplay MP3.
3. Jika `riskLevel` adalah `HIGH` atau `CRISIS`, jangan autoplay. Tampilkan pesan keselamatan dan nyalakan LED warning.
4. Simpan `sessionId` yang diterima sebagai `activeSessionId`.

## Download dan autoplay MP3

```http
GET /devices/runtime/voice/turns/voice-turn-id/audio
Authorization: Device <HAPPIFY_DEVICE_RUNTIME_TOKEN>
Accept: audio/mpeg
```

Responsnya raw MP3 bytes. Hentikan audio lama sebelum memutar audio baru. Audio jangan disimpan permanen.

## Session state

Gunakan dua state persistent:

```cpp
String activeSessionId = "nanda-session-001";
uint32_t sessionCounter = 1;
```

Behavior:

```text
Mic normal       -> pakai activeSessionId, berarti lanjut sesi
NEW SESSION      -> sessionCounter++, activeSessionId = "nanda-session-" + counter
Power restart    -> load activeSessionId dan sessionCounter dari NVS
```

Device tidak perlu membaca atau menampilkan riwayat chat.

## Error mapping

| API message | UI device | Tindakan |
| --- | --- | --- |
| `DEVICE_UNAUTHENTICATED` | `TOKEN EXPIRED` | Jalankan `npm run provision:iot:nanda`, copy header baru, flash/reload firmware. |
| `AI_CONSENT_REQUIRED` | `VOICE CONSENT REQUIRED` | Aktifkan consent Voice Processing di aplikasi Nanda. |
| `INVALID_AUDIO` | `RECORD AGAIN` | Rekaman terlalu singkat/rusak. |
| `AUDIO_TOO_LARGE` | `AUDIO TOO LONG` | Batasi panjang rekam. |
| `UNSUPPORTED_AUDIO_TYPE` | `AUDIO FORMAT ERROR` | Kirim WAV. |
| `VOICE_UPSTREAM_INVALID` | `AI TEMPORARILY UNAVAILABLE` | Retry setelah delay. |
| `VOICE_AUDIO_NOT_FOUND` | `TEXT RESPONSE ONLY` | Tampilkan `responseText` saja. |
| HTTP timeout | `CHECK WIFI` | Retry dengan idempotency key sama. |

## State machine

```text
BOOT
  -> WIFI_CONNECTING
  -> CONTEXT_LOADING
  -> READY
  -> RECORDING
  -> UPLOADING
  -> WAITING_FOR_AI
  -> PLAYING_RESPONSE
  -> READY

ERROR states:
  WIFI_ERROR
  TOKEN_EXPIRED
  CONSENT_REQUIRED
  SAFETY_ALERT
```

## Complete pseudocode

```cpp
#include "wifi-secrets.h"
#include "nanda-voice-companion-context.h"

String activeSessionId;
uint32_t sessionCounter;
RuntimeContext context;

void setup() {
  initDisplay();
  initMic();
  initSpeaker();
  connectWifi(WIFI_SSID, WIFI_PASSWORD);

  context = getJson(
    HAPPIFY_API_BASE_URL + "/devices/runtime/context",
    {"Authorization", "Device " + String(HAPPIFY_DEVICE_RUNTIME_TOKEN)}
  );

  if (!context.voice.voiceConsentAccepted) {
    show("VOICE CONSENT REQUIRED");
    disableMic();
    return;
  }

  activeSessionId = loadNvs("session", "nanda-session-001");
  sessionCounter = loadNvsInt("sessionCounter", 1);
  show("READY " + context.user.displayName);
}

void onNewSessionPressed() {
  stopSpeaker();
  sessionCounter++;
  activeSessionId = "nanda-session-" + String(sessionCounter);
  saveNvs("session", activeSessionId);
  saveNvsInt("sessionCounter", sessionCounter);
  show("NEW SESSION");
}

void onMicReleased(uint8_t* wav, size_t length) {
  String key = "iot-voice-" + String(nextPersistentCounter());
  HttpResponse response = postBinary(
    HAPPIFY_API_BASE_URL + context.voice.turnEndpoint,
    wav,
    length,
    {
      {"Authorization", "Device " + String(HAPPIFY_DEVICE_RUNTIME_TOKEN)},
      {"Content-Type", "audio/wav"},
      {"X-Voice-Language", context.voice.language},
      {"X-Session-Id", activeSessionId},
      {"Idempotency-Key", key}
    }
  );

  if (response.status != 201) {
    showMappedError(response.message);
    return;
  }

  VoiceTurn turn = response.json.data.turn;
  activeSessionId = turn.sessionId;
  saveNvs("session", activeSessionId);
  show(turn.responseText);

  if (turn.riskLevel == "HIGH" || turn.riskLevel == "CRISIS") {
    stopSpeaker();
    showSafetyAlert();
    return;
  }

  if (turn.audioUrl.length() > 0) {
    stopSpeaker();
    playMp3(getBinary(
      HAPPIFY_API_BASE_URL + "/devices/runtime/voice/turns/" + turn.id + "/audio",
      {{"Authorization", "Device " + String(HAPPIFY_DEVICE_RUNTIME_TOKEN)}}
    ));
  }
}
```
