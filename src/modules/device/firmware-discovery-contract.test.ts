import assert from 'node:assert/strict';
import test from 'node:test';

import { deviceIdParamsSchema, otaSchema } from './device.validation.js';
import { getErrorMessage, getStatusCode } from '../../utils/request.util.js';

test('validates device and firmware identifiers as CUIDs', () => {
  assert.equal(deviceIdParamsSchema.safeParse({ id: 'not-a-cuid' }).success, false);
  assert.equal(otaSchema.safeParse({ firmwareId: 'not-a-cuid' }).success, false);
  assert.equal(
    otaSchema.safeParse({ firmwareId: 'cm1234567890abcdefghijklm', extra: true }).success,
    false,
  );
});

test('maps firmware discovery and OTA errors exactly', () => {
  const cases = [
    ['NOT_FOUND', 404],
    ['FIRMWARE_INCOMPATIBLE', 400],
    ['OTA_ALREADY_ACTIVE', 409],
  ] as const;

  for (const [message, status] of cases) {
    const error = new Error(message);
    assert.equal(getStatusCode(error), status);
    assert.equal(getErrorMessage(error), message);
  }
});
