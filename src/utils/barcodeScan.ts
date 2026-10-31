import { BARCODE_SCAN_COOLDOWN_MS } from "@/constants/barcode";

export function normalizeScannedPayload(raw: string): string {
  return (raw ?? "").trim();
}

export function shouldAcceptScan(
  lastCode: string | null,
  lastAt: number | null,
  nextCode: string,
  now = Date.now(),
): boolean {
  const normalized = normalizeScannedPayload(nextCode);
  if (!normalized) {
    return false;
  }

  if (
    lastCode === normalized &&
    lastAt !== null &&
    now - lastAt < BARCODE_SCAN_COOLDOWN_MS
  ) {
    return false;
  }

  return true;
}
