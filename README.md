# BE-Happify

Express and Prisma backend for Happify.

## Companion contracts

Device runtime endpoints require `Authorization: Device <credential>` from a paired device:

- `POST /devices/runtime/heartbeat` records firmware, hardware, bootloader, protocol, supported command types, and heartbeat telemetry.
- `POST /devices/runtime/telemetry` accepts bounded numeric telemetry batches.
- `POST /devices/runtime/emotion-observations` accepts already-extracted `VOICE`, `CAMERA`, or `FUSED` observations with confidence, consent evidence, model provenance, and retention metadata.
- `POST /devices/runtime/camera-observations` requires validated `facePresent`, `eyeContact`, and normalized expression probabilities. Hardware and its declared model supply these observations; raw images are not accepted or stored.
- `POST /devices/runtime/mood-sync` idempotently creates device-originated mood or check-in records.
- `GET /devices/runtime/commands` returns pending or acknowledged commands.
- `PATCH /devices/runtime/commands/:id` enforces command lifecycle transitions and error evidence for failures.
- `GET /devices/runtime/ota` and `PATCH /devices/runtime/ota/:id` expose compatible OTA deployments and enforce monotonic lifecycle/progress.

Authenticated users can create typed commands with `POST /devices/:id/commands`. `HAPTIC_THERAPY` validates bounded segments, amplitudes, pauses, repeats, expiry, and total duration. Device heartbeat capability declarations are used to reject incompatible commands.

Administrators can create firmware releases with model, semantic version, protocol version, optional hardware revision, optional minimum bootloader version, URL, and SHA-256. `PATCH /devices/firmware/:id/status` manages active/deprecated status. OTA creation checks model, hardware revision, protocol, bootloader minimum, and active-deployment compatibility.

Emotion observation ingestion requires the latest accepted `DEVICE_EMOTION_OBSERVATION` consent and rejects retention beyond `DEVICE_OBSERVATION_RETENTION_DAYS`.

## Simulator

Set `ENABLE_SIMULATOR_ROUTES=true`, register a simulated device with `npm run simulator:register`, pair it, issue a runtime credential, and set `SIMULATOR_DEVICE_TOKEN`. `npm run simulator:telemetry` sends heartbeat and telemetry, performs idempotent mood sync, optionally sends a camera observation when `SIMULATOR_OBSERVATION_CONSENT_ID` is set, and acknowledges one pending haptic command.

The simulator exercises HTTP software contracts only. It does not validate physical BLE/Wi-Fi transport, MQTT delivery/QoS, mTLS provisioning/rotation, camera hardware/model output, actuator safety, haptic calibration, bootloader flashing, signed firmware verification, rollback, power-loss recovery, or real-device OTA behavior.

## Configuration

Copy `.env.example` to `.env`. Companion-specific settings include pairing and credential TTLs, observation retention, simulator device metadata, and optional observation consent evidence.

## Voice production configuration

The voice path is `Mobile -> BE-Happify -> AI-Happify`. Configure the deployed backend with:

- `AI_VOICE_BASE_URL`: the public HTTPS URL of the Railway AI service.
- `AI_SERVICE_TOKEN`: exactly the same long random token configured on AI-Happify.
- `VOICE_UPSTREAM_TIMEOUT_MS`: keep within the mobile receive timeout; the default is 45 seconds.

The BE adapter accepts the canonical AI `1.0.0` response and normalizes transcript, response text, risk, request ID, and protected TTS audio. AI audio remains behind the backend-owned authenticated playback route.

## Verification

```bash
npx prisma format
npx prisma validate
npx prisma generate
npm test
npm run build
```

Database migrations are intentionally not run by these verification commands.
