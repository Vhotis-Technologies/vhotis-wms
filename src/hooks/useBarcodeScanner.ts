import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  type BarcodeScanningResult,
  type BarcodeSettings,
  useCameraPermissions,
} from "expo-camera";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { WMS_BARCODE_TYPES } from "@/constants/barcode";
import {
  normalizeScannedPayload,
  shouldAcceptScan,
} from "@/utils/barcodeScan";

interface UseBarcodeScannerOptions {
  enabled?: boolean;
  isLoading?: boolean;
  onScan: (data: string) => void;
}

export function useBarcodeScanner({
  enabled = true,
  isLoading = false,
  onScan,
}: UseBarcodeScannerOptions) {
  const [permission, requestPermission] = useCameraPermissions(); // Ensure that the camera permission is granted
  const [isFocused, setIsFocused] = useState(true); // Ensure that the camera is focused
  const lastScanRef = useRef<{ code: string | null; at: number | null }>({
    code: null,
    at: null,
  }); // Ensure that the last scan is stored

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  useEffect(() => {
    if (!enabled || permission?.granted) {
      return;
    }
    if (Platform.OS === "web") {
      return;
    }
    void requestPermission();
  }, [enabled, permission?.granted, requestPermission]);

  const isPaused = !enabled || isLoading || !isFocused;
  const permissionGranted = Boolean(permission?.granted);
  const permissionPending = permission === null;

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (isPaused) {
        return;
      }

      const normalized = normalizeScannedPayload(result.data);
      if (
        !shouldAcceptScan(
          lastScanRef.current.code,
          lastScanRef.current.at,
          normalized,
        )
      ) {
        return;
      }

      lastScanRef.current = { code: normalized, at: Date.now() };
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onScan(normalized);
    },
    [isPaused, onScan],
  );

  const barcodeScannerSettings = useMemo<BarcodeSettings>(
    () => ({
      barcodeTypes: WMS_BARCODE_TYPES,
    }),
    [],
  );

  const scannerProps = useMemo(
    () => ({
      onBarcodeScanned:
        isPaused || !permissionGranted || Platform.OS === "web"
          ? undefined
          : handleBarcodeScanned,
      barcodeScannerSettings,
    }),
    [
      barcodeScannerSettings,
      handleBarcodeScanned,
      isPaused,
      permissionGranted,
    ],
  );

  return {
    permissionGranted,
    permissionPending,
    permissionDenied: permission !== null && !permission.granted,
    requestPermission,
    scannerProps,
    isPaused,
  };
}
