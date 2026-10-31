import type { BarcodeType } from "expo-camera";

export const WMS_BARCODE_TYPES: BarcodeType[] = [
  "qr",
  "code128",
  "code39",
  "ean13",
  "ean8",
];

export const BARCODE_SCAN_COOLDOWN_MS = 1500;
