import assert from 'node:assert/strict';
import test from 'node:test';

import { voiceUpstreamSchema } from './voice.validation.js';

const canonicalResponse = {
  contract_version: '1.0.0',
  request_id: 'req-voice-1',
  turn_id: 'turn-voice-1',
  transcript: {
    text: 'I need someone to talk to.',
    language: 'en',
    confidence: 0.94,
  },
  response: {
    text: 'I am here with you.',
    source: 'fallback',
    audio_url: '/api/audio/tts_abcdef123456.mp3',
  },
  emotion: {
    state: 'distressed',
    confidence: 0.88,
    risk_level: 'high',
    requires_referral: true,
  },
  intent: {
    name: 'emotional_support',
    confidence: 0.9,
    trigger: null,
    requires_sos: false,
    requires_referral: true,
  },
  risk_policy: {
    version: '1.0.0',
    severity: 'high',
    deterministic_severity: 'high',
    llm_reported_severity: null,
    multimodal_reported_severity: null,
    rule_id: 'distress-high',
    matched_terms: ['need someone'],
    llm_floor_applied: false,
    multimodal_floor_applied: false,
    multimodal_raised_severity: false,
  },
  recording_quality: {
    normalized: true,
  },
  citations: [],
  prompt: {
    registry_version: '1',
    registry_hash: 'hash',
    prompt_id: 'voice',
    prompt_version: '1',
    prompt_hash: 'hash',
  },
  latency: {
    total_ms: 500,
  },
  text: 'I need someone to talk to.',
  message: 'I am here with you.',
  audio_url: '/api/audio/tts_abcdef123456.mp3',
  audioUrl: '/api/audio/tts_abcdef123456.mp3',
  language: 'en',
  confidence: 0.94,
  response_source: 'fallback',
  responseSource: 'fallback',
  latency_ms: 500,
};

test('normalizes the canonical AI voice contract', () => {
  const result = voiceUpstreamSchema.parse(canonicalResponse);

  assert.deepEqual(result, {
    transcript: 'I need someone to talk to.',
    responseText: 'I am here with you.',
    riskLevel: 'HIGH',
    detectedMood: 'DISTRESSED',
    emotionConfidence: 0.88,
    upstreamAudioPath: '/api/audio/tts_abcdef123456.mp3',
    upstreamRequestId: 'req-voice-1',
  });
});

test('normalizes the legacy snake-case contract', () => {
  const result = voiceUpstreamSchema.parse({
    transcript: 'Hello',
    response_text: 'Welcome',
    risk_level: 'LOW',
    audio_url: null,
    request_id: 'legacy-1',
  });

  assert.deepEqual(result, {
    transcript: 'Hello',
    responseText: 'Welcome',
    riskLevel: 'LOW',
    detectedMood: null,
    emotionConfidence: null,
    upstreamAudioPath: null,
    upstreamRequestId: 'legacy-1',
  });
});

test('rejects unusable and unsafe upstream payloads', () => {
  assert.equal(voiceUpstreamSchema.safeParse({}).success, false);
  assert.equal(
    voiceUpstreamSchema.safeParse({
      ...canonicalResponse,
      response: {
        ...canonicalResponse.response,
        audio_url: 'https://untrusted.example/audio.mp3',
      },
      audio_url: 'https://untrusted.example/audio.mp3',
      audioUrl: 'https://untrusted.example/audio.mp3',
    }).success,
    false,
  );
});

test('rejects an unsafe upstream mood value', () => {
  assert.equal(
    voiceUpstreamSchema.safeParse({
      ...canonicalResponse,
      emotion: { ...canonicalResponse.emotion, state: 'angry' },
    }).success,
    false,
  );
});
