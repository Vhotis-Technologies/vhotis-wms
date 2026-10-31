import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import BarcodeCameraLayer from "@/app/components/shared/BarcodeCameraLayer";
import StyledText from "@/app/components/StyledText";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickScanType } from "@/interfaces/picker";

interface ScanViewportProps {
  scanStep?: PickScanType;
  locationCode?: string;
  containerCode?: string | null;
  prompt?: string;
  enabled?: boolean;
  isLoading?: boolean;
  onBarcodeScan?: (data: string) => void;
  variant?: "full" | "compact";
}

function getDefaultPrompt(
  scanStep: PickScanType | undefined,
  locationCode?: string,
  containerCode?: string | null,
) {
  switch (scanStep) {
    case "location":
      return locationCode
        ? `Scan bin label ${locationCode}`
        : "Scan bin or shelf label";
    case "container":
      return containerCode
        ? `Scan container ${containerCode}`
        : "Scan container / box / pallet";
    case "unit":
      return "Scan unit barcode";
    default:
      return "Scan barcode";
  }
}

const CORNER = 24;
const BORDER = 3;
const VIEWPORT_HEIGHTS = {
  full: 180,
  compact: 120,
} as const;
const SCAN_LINE_HEIGHT = 2;
const SCAN_INSET = 5 + CORNER;

export default function ScanViewport({
  scanStep,
  locationCode,
  containerCode,
  prompt,
  enabled = true,
  isLoading = false,
  onBarcodeScan,
  variant = "full",
}: ScanViewportProps) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const viewportHeight = VIEWPORT_HEIGHTS[variant];
  const scanTravel = viewportHeight - SCAN_INSET * 2 - SCAN_LINE_HEIGHT;
  const scanDurationMs = variant === "compact" ? 1800 : 2000;

  const displayPrompt =
    prompt ?? getDefaultPrompt(scanStep, locationCode, containerCode);

  const {
    permissionGranted,
    permissionDenied,
    permissionPending,
    requestPermission,
    scannerProps,
  } = useBarcodeScanner({
    enabled: enabled && Boolean(onBarcodeScan),
    isLoading,
    onScan: (data) => onBarcodeScan?.(data),
  });

  const scanProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: scanDurationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: scanDurationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [scanDurationMs, scanProgress]);

  const scanLineTranslateY = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scanTravel],
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.viewport,
          { height: viewportHeight, borderColor },
        ]}
      >
        <BarcodeCameraLayer
          scannerProps={scannerProps}
          permissionGranted={permissionGranted}
          permissionDenied={permissionDenied}
          permissionPending={permissionPending}
          onRequestPermission={() => {
            void requestPermission();
          }}
        />

        {permissionGranted ? (
          <View style={styles.scrim} pointerEvents="none" />
        ) : null}

        <View style={styles.overlay} pointerEvents="none">
          <View style={[styles.corner, styles.topLeft, { borderColor: successColor }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: successColor }]} />
          <Animated.View
            style={[
              styles.scanLine,
              {
                backgroundColor: successColor,
                transform: [{ translateY: scanLineTranslateY }],
              },
            ]}
          />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: successColor }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: successColor }]} />
          <StyledText variant="mono" color={iconMuted} style={styles.prompt}>
            {displayPrompt}
          </StyledText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  viewport: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  prompt: {
    textAlign: "center",
    paddingHorizontal: 24,
  },
  scanLine: {
    position: "absolute",
    top: SCAN_INSET,
    left: 24,
    right: 24,
    height: SCAN_LINE_HEIGHT,
    opacity: 0.9,
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: BORDER,
    borderLeftWidth: BORDER,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: BORDER,
    borderRightWidth: BORDER,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: BORDER,
    borderLeftWidth: BORDER,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: BORDER,
    borderRightWidth: BORDER,
  },
});
