import assert from 'node:assert/strict';
import test from 'node:test';

import { getErrorMessage, getStatusCode } from './request.util.js';

test('maps Firebase token errors to an unauthenticated response', () => {
  const error = Object.assign(new Error('Firebase ID token has expired.'), {
    code: 'auth/id-token-expired',
  });

  assert.equal(getStatusCode(error), 401);
  assert.equal(getErrorMessage(error), 'UNAUTHENTICATED');
});
