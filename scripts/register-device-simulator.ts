import 'dotenv/config';
const baseUrl = (process.env.PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const token = process.env.SIMULATOR_ADMIN_TOKEN;
const serialNumber = process.env.SIMULATOR_SERIAL_NUMBER ?? 'HAPPIFY-SIM-001';
const claimSecret = process.env.SIMULATOR_CLAIM_SECRET;
if (!token || !claimSecret) throw new Error('SIMULATOR_ADMIN_TOKEN and SIMULATOR_CLAIM_SECRET are required');
const response = await fetch(`${baseUrl}/simulator/devices`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ serialNumber, model: process.env.SIMULATOR_MODEL ?? 'Happify-Sim', claimSecret, hardwareRevision: process.env.SIMULATOR_HARDWARE_REVISION ?? 'sim-1', bootloaderVersion: process.env.SIMULATOR_BOOTLOADER_VERSION ?? '1.0.0', protocolVersion: process.env.SIMULATOR_PROTOCOL_VERSION ?? '1.0.0', supportedCommandTypes: ['HAPTIC_THERAPY', 'DISPLAY_MESSAGE', 'SET_CONFIGURATION', 'RESTART'] }) });
if (!response.ok) throw new Error(`Simulator registration failed: ${response.status}`);
console.log(JSON.stringify(await response.json(), null, 2));
