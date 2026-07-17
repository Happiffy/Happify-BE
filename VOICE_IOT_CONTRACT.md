# IoT Voice Companion One-Shot Context

Firmware hanya perlu dua nilai private saat boot:

```cpp
#define API_BASE_URL "https://<HAPPIFY_BACKEND_HOST>"
#define DEVICE_RUNTIME_TOKEN "<DEVICE_RUNTIME_TOKEN>"
```

Jangan hardcode `userId`, `deviceId`, serial number, consent ID, atau endpoint voice. Ambil semuanya satu kali melalui context endpoint.

## Boot context request

```http
GET /devices/runtime/context
Authorization: Bearer <DEVICE_RUNTIME_TOKEN>
```

## Boot context response

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
        "allowedContentTypes": ["audio/wav"],
        "turnEndpoint": "/devices/runtime/voice/turns",
        "audioEndpointTemplate": "/devices/runtime/voice/turns/{turnId}/audio"
      }
    }
  }
}
```

Firmware menyimpan context ini di RAM/NVS. Jika `voiceConsentAccepted` bernilai `false`, jangan aktifkan tombol rekam dan tampilkan `Voice consent required in Happify app`.

## Voice request

```http
POST {voice.turnEndpoint}
Authorization: Bearer <DEVICE_RUNTIME_TOKEN>
Content-Type: audio/wav
X-Voice-Language: {voice.language}
X-Session-Id: nanda-session-001
Idempotency-Key: iot-voice-000001

<raw WAV bytes>
```

Backend otomatis memakai owner device sebagai user. Dengan device seed Nanda, voice turn otomatis milik Nanda tanpa firmware mengirim user ID.

## Voice response and autoplay

```json
{
  "status": "success",
  "data": {
    "turn": {
      "id": "voice-turn-id",
      "sessionId": "nanda-session-001",
      "responseText": "Mari tarik napas perlahan bersama.",
      "riskLevel": "LOW",
      "audioUrl": "/voice/turns/voice-turn-id/audio"
    }
  }
}
```

Jika `riskLevel` adalah `LOW` atau `MEDIUM`, request dan putar MP3 otomatis:

```http
GET /devices/runtime/voice/turns/{turn.id}/audio
Authorization: Bearer <DEVICE_RUNTIME_TOKEN>
Accept: audio/mpeg
```

Jika `riskLevel` `HIGH` atau `CRISIS`, jangan autoplay. Tampilkan peringatan keselamatan.

## Session

```text
Mic biasa: lanjut activeSessionId
New Session button: activeSessionId = "nanda-session-" + counter
```

Firmware tidak perlu chat history dan tidak perlu mengetahui database ID Nanda.

## Firmware pseudocode

```cpp
Context ctx = GET(API_BASE_URL + "/devices/runtime/context", deviceToken);
if (!ctx.voice.voiceConsentAccepted) disableMicrophone();

VoiceTurn turn = POST_BINARY(
  API_BASE_URL + ctx.voice.turnEndpoint,
  wavBytes,
  {
    "Authorization": "Bearer " + deviceToken,
    "Content-Type": "audio/wav",
    "X-Voice-Language": ctx.voice.language,
    "X-Session-Id": activeSessionId,
    "Idempotency-Key": nextVoiceKey()
  }
);

if (turn.riskLevel == "LOW" || turn.riskLevel == "MEDIUM") {
  playMp3(GET(
    API_BASE_URL + replace(ctx.voice.audioEndpointTemplate, "{turnId}", turn.id),
    {"Authorization": "Bearer " + deviceToken}
  ));
}
```
