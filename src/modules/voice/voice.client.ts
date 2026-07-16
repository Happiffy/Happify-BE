const baseUrl = process.env.AI_VOICE_BASE_URL?.replace(/\/$/, '');
const serviceToken = process.env.AI_SERVICE_TOKEN;
const timeoutMs = Number(process.env.VOICE_UPSTREAM_TIMEOUT_MS ?? 45000);

function requireConfig() {
  if (!baseUrl || !serviceToken) throw new Error('VOICE_NOT_CONFIGURED');
  return { baseUrl, serviceToken };
}

export async function processVoiceAudio(audio: Buffer, contentType: string, language: 'id' | 'en') {
  const config = requireConfig();
  const response = await fetch(`${config.baseUrl}/api/process-audio`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.serviceToken}`, 'Content-Type': contentType, 'X-Voice-Language': language },
    body: new Uint8Array(audio),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(response.status === 413 ? 'AUDIO_TOO_LARGE' : 'VOICE_UPSTREAM_FAILED');
  return response.json() as Promise<Record<string, unknown>>;
}

export async function fetchVoiceAudio(path: string) {
  const config = requireConfig();
  if (!/^\/api\/audio\/tts_[a-f0-9]{12}\.mp3$/.test(path)) throw new Error('VOICE_AUDIO_NOT_FOUND');
  const response = await fetch(`${config.baseUrl}${path}`, { headers: { Authorization: `Bearer ${config.serviceToken}` }, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok || !response.body) throw new Error('VOICE_AUDIO_NOT_FOUND');
  return response;
}
