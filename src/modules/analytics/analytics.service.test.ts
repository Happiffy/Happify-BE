import assert from 'node:assert/strict';
import test from 'node:test';

import { summarizeVoiceMoodPattern } from './analytics.service.js';

test('summarizes analyzed voice moods by frequency', () => {
  assert.deepEqual(
    summarizeVoiceMoodPattern([
      { detectedMood: 'ANXIOUS' },
      { detectedMood: 'CALM' },
      { detectedMood: 'ANXIOUS' },
      { detectedMood: null },
    ]),
    {
      totalAnalyzedTurns: 3,
      dominantMood: 'ANXIOUS',
      counts: [
        { state: 'ANXIOUS', count: 2 },
        { state: 'CALM', count: 1 },
      ],
    },
  );
});

test('returns an empty pattern when no voice mood has been analyzed', () => {
  assert.deepEqual(summarizeVoiceMoodPattern([{ detectedMood: null }]), {
    totalAnalyzedTurns: 0,
    dominantMood: null,
    counts: [],
  });
});
