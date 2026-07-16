import 'dotenv/config';
import { randomUUID } from 'node:crypto';

const baseUrl = (process.env.PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const token = process.env.SIMULATOR_DEVICE_TOKEN;
if (!token) throw new Error('SIMULATOR_DEVICE_TOKEN is required');
const headers = { Authorization: `Device ${token}`, 'Content-Type': 'application/json' };

async function request(path: string, method: string, body?: unknown) {
  const response = await fetch(`${baseUrl}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) throw new Error(`${path} failed: ${response.status} ${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
}

const now = new Date();
const results: Record<string, unknown> = {};
results.heartbeat = await request('/devices/runtime/heartbeat', 'POST', { firmwareVersion: process.env.SIMULATOR_FIRMWARE_VERSION ?? '1.0.0', hardwareRevision: process.env.SIMULATOR_HARDWARE_REVISION ?? 'sim-1', bootloaderVersion: process.env.SIMULATOR_BOOTLOADER_VERSION ?? '1.0.0', protocolVersion: process.env.SIMULATOR_PROTOCOL_VERSION ?? '1.0.0', supportedCommandTypes: ['HAPTIC_THERAPY', 'DISPLAY_MESSAGE', 'SET_CONFIGURATION', 'RESTART'] });
results.telemetry = await request('/devices/runtime/telemetry', 'POST', { items: [{ metric: 'heart_rate', value: Number(process.env.SIMULATOR_HEART_RATE ?? 72), unit: 'bpm', recordedAt: now.toISOString(), metadata: { simulator: true } }] });
results.moodSync = await request('/devices/runtime/mood-sync', 'POST', { kind: 'CHECK_IN', state: process.env.SIMULATOR_MOOD_STATE ?? 'CALM', intensity: Number(process.env.SIMULATOR_MOOD_INTENSITY ?? 3), triggers: ['simulator'], note: 'Companion simulator check-in', observedAt: now.toISOString(), idempotencyKey: `sim-mood-${randomUUID()}` });

const consentId = process.env.SIMULATOR_OBSERVATION_CONSENT_ID;
if (consentId) {
  results.cameraObservation = await request('/devices/runtime/camera-observations', 'POST', { source: 'CAMERA', state: 'CALM', confidence: 0.76, riskLevel: 'LOW', facePresent: true, eyeContact: true, expressionProbabilities: { HAPPY: 0.12, CALM: 0.64, NEUTRAL: 0.18, ANXIOUS: 0.03, SAD: 0.02, DISTRESSED: 0.01 }, observationProvider: { provider: 'Happify Simulator', model: 'synthetic-observation', version: '1.0.0' }, consentEvidence: { consentId, version: Number(process.env.SIMULATOR_OBSERVATION_CONSENT_VERSION ?? 1) }, retention: { policy: 'simulator-default', retainUntil: new Date(now.getTime() + Number(process.env.DEVICE_OBSERVATION_RETENTION_DAYS ?? 30) * 86400000 - 60000).toISOString() }, idempotencyKey: `sim-camera-${randomUUID()}`, observedAt: now.toISOString() });
}

const commands = await request('/devices/runtime/commands', 'GET');
const pending = (commands as { data?: { items?: Array<{ id: string; type: string; status: string }> } }).data?.items ?? [];
const haptic = pending.find((command) => command.type === 'HAPTIC_THERAPY' && command.status === 'PENDING');
if (haptic) results.hapticAcknowledgement = await request(`/devices/runtime/commands/${haptic.id}`, 'PATCH', { status: 'ACKNOWLEDGED' });

console.log(JSON.stringify(results, null, 2));
