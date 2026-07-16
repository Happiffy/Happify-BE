import assert from 'node:assert/strict';
import test from 'node:test';

import { compareNumericTriplets, isFirmwareCompatible } from './firmware-compatibility.js';

const device = {
  model: 'HAPPIFY-ONE',
  hardwareRevision: 'rev-a',
  bootloaderVersion: '1.10.0',
  protocolVersion: '2.0.0',
};

const firmware = {
  model: 'HAPPIFY-ONE',
  hardwareRevision: 'rev-a',
  minimumBootloaderVersion: '1.2.0',
  protocolVersion: '2.0.0',
};

test('compares numeric version triplets instead of lexicographic strings', () => {
  assert.ok(compareNumericTriplets('1.10.0', '1.2.0') > 0);
  assert.ok(compareNumericTriplets('2.0.0', '10.0.0') < 0);
  assert.equal(compareNumericTriplets('1.2.3-beta.1', '1.2.3+build.9'), 0);
});

test('preserves zero-triplet fallback for values without a numeric prefix', () => {
  assert.equal(compareNumericTriplets('invalid', '0.0.0'), 0);
  assert.ok(compareNumericTriplets('invalid', '0.0.1') < 0);
});

test('accepts matching firmware at or below the device bootloader version', () => {
  assert.equal(isFirmwareCompatible(device, firmware), true);
  assert.equal(
    isFirmwareCompatible(device, {
      ...firmware,
      minimumBootloaderVersion: '1.10.0-beta.1',
    }),
    true,
  );
});

test('rejects model, protocol, hardware, and bootloader mismatches', () => {
  assert.equal(isFirmwareCompatible(device, { ...firmware, model: 'OTHER' }), false);
  assert.equal(isFirmwareCompatible(device, { ...firmware, protocolVersion: '3.0.0' }), false);
  assert.equal(isFirmwareCompatible(device, { ...firmware, hardwareRevision: 'rev-b' }), false);
  assert.equal(isFirmwareCompatible(device, { ...firmware, minimumBootloaderVersion: '1.11.0' }), false);
  assert.equal(isFirmwareCompatible({ ...device, protocolVersion: null }, firmware), false);
  assert.equal(isFirmwareCompatible({ ...device, protocolVersion: '' }, firmware), false);
  assert.equal(isFirmwareCompatible({ ...device, bootloaderVersion: null }, firmware), false);
  assert.equal(isFirmwareCompatible({ ...device, bootloaderVersion: '' }, firmware), false);
});

test('allows firmware without optional hardware and bootloader constraints', () => {
  assert.equal(
    isFirmwareCompatible(
      { ...device, hardwareRevision: null, bootloaderVersion: null },
      { ...firmware, hardwareRevision: null, minimumBootloaderVersion: null },
    ),
    true,
  );
});
