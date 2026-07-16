export type FirmwareCompatibilityDevice = {
  model: string;
  hardwareRevision: string | null;
  bootloaderVersion: string | null;
  protocolVersion: string | null;
};

export type FirmwareCompatibilityRelease = {
  model: string;
  hardwareRevision: string | null;
  minimumBootloaderVersion: string | null;
  protocolVersion: string;
};

export function compareNumericTriplets(left: string, right: string): number {
  const parts = (value: string) => value.match(/^\d+\.\d+\.\d+/)?.[0].split('.').map(Number) ?? [];
  const leftParts = parts(left);
  const rightParts = parts(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function isFirmwareCompatible(device: FirmwareCompatibilityDevice, firmware: FirmwareCompatibilityRelease): boolean {
  if (firmware.model !== device.model || !device.protocolVersion || firmware.protocolVersion !== device.protocolVersion) return false;
  if (firmware.hardwareRevision && firmware.hardwareRevision !== device.hardwareRevision) return false;
  if (firmware.minimumBootloaderVersion && (!device.bootloaderVersion || compareNumericTriplets(device.bootloaderVersion, firmware.minimumBootloaderVersion) < 0)) return false;
  return true;
}
