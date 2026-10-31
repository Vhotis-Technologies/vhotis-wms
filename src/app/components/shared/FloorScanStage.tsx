import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, TextInput, View } from "react-native";

import BarcodeCameraLayer from "@/app/components/shared/BarcodeCameraLayer";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickScanType } from "@/interfaces/picker";

import { flatButton, flatPanel, FLOOR_BORDER } from "./floorStyles";

interface FloorScanStageProps {
  prompt: string;
  detail?: string;
  viewportPrompt?: string;
  scanStep?: PickScanType;
  locationCode?: string;
  containerCode?: string | null;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (payload?: string) => void | Promise<void>;
  isLoading?: boolean;
  enabled?: boolean;
  confirmTitle?: string;
  confirmDisabled?: boolean;
  showConfirmButton?: boolean;
  showViewport?: boolean;
  inputPlaceholder?: string;
  variant?: "full" | "compact";
  footerActions?: ReactNode;
  successMessage?: string | null;
  successColor?: string;
}

const CORNER = 20;
const BORDER = 3;
const VIEWPORT_HEIGHTS = { full: 180, compact: 120 } as const;
const SCAN_LINE_HEIGHT = 2;
const SCAN_INSET = 5 + CORNER;

function FlatScanViewport({
  scanStep,
  locationCode,
  containerCode,
  prompt,
  enabled,
  isLoading,
  onBarcodeScan,
  variant = "full",
}: {
  scanStep?: PickScanType;
  locationCode?: string;
  containerCode?: string | null;
  prompt?: string;
  enabled?: boolean;
  isLoading?: boolean;
  onBarcodeScan?: (data: string) => void;
  variant?: "full" | "compact";
}) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const viewportHeight = VIEWPORT_HEIGHTS[variant];
  const scanTravel = viewportHeight - SCAN_INSET * 2 - SCAN_LINE_HEIGHT;

  const displayPrompt = (() => {
    if (prompt) return prompt;
    switch (scanStep) {
      case "location":
        return locationCode ? `Scan bin label ${locationCode}` : "Scan bin or shelf label";
      case "container":
        return containerCode ? `Scan container ${containerCode}` : "Scan container / box / pallet";
      case "unit":
        return "Scan unit barcode";
      default:
        return "Scan barcode";
    }
  })();

  const {
    permissionGranted,
    permissionDenied,
    permissionPending,
    requestPermission,
    scannerProps,
  } = useBarcodeScanner({
    enabled: enabled && Boolean(onBarcodeScan),
    isLoading: isLoading ?? false,
    onScan: (data) => onBarcodeScan?.(data),
  });

  const scanProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanProgress]);

  const scanLineTranslateY = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scanTravel],
  });

  return (
    <View style={[styles.viewport, flatPanel, { height: viewportHeight, borderColor }]}>
      <BarcodeCameraLayer
        scannerProps={scannerProps}
        permissionGranted={permissionGranted}
        permissionDenied={permissionDenied}
        permissionPending={permissionPending}
        onRequestPermission={() => {
          void requestPermission();
        }}
      />
      {permissionGranted ? <View style={styles.scrim} pointerEvents="none" /> : null}
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
        <StyledText variant="mono" color={iconMuted} style={styles.viewportPrompt}>
          {displayPrompt}
        </StyledText>
      </View>
    </View>
  );
}

function FlatScanBanner({ prompt, detail }: { prompt: string; detail?: string }) {
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const textColor = useThemeColor({}, "text");
  const bandForeground = useThemeColor({}, "background");

  return (
    <View style={[styles.banner, flatPanel, { backgroundColor: cardColor, borderColor }]}>
      <View style={[styles.bannerBand, { backgroundColor: textColor }]}>
        <StyledText variant="eyebrow" style={[styles.bannerBandText, { color: bandForeground }]}>
          SCAN
        </StyledText>
      </View>
      <View style={styles.bannerBody}>
        <StyledText variant="bodyMedium" color={iconMuted} style={styles.bannerPrompt}>
          {prompt}
        </StyledText>
        {detail ? (
          <StyledText variant="monoSmall" color={successColor}>
            {detail}
          </StyledText>
        ) : null}
      </View>
    </View>
  );
}

function FlatScanInput({
  value,
  onChangeText,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const textColor = useThemeColor({}, "text");
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      autoFocus={false}
      autoCapitalize="characters"
      autoCorrect={false}
      placeholder={placeholder ?? "Enter or scan barcode"}
      placeholderTextColor={iconMuted}
      style={[
        styles.input,
        {
          backgroundColor: cardColor,
          borderColor,
          color: textColor,
        },
      ]}
      returnKeyType="done"
      blurOnSubmit={false}
    />
  );
}

export default function FloorScanStage({
  prompt,
  detail,
  viewportPrompt,
  scanStep,
  locationCode,
  containerCode,
  value,
  onChangeText,
  onSubmit,
  isLoading = false,
  enabled = true,
  confirmTitle = "Confirm scan",
  confirmDisabled = false,
  showConfirmButton = true,
  showViewport = true,
  inputPlaceholder,
  variant = "full",
  footerActions,
  successMessage,
  successColor,
}: FloorScanStageProps) {
  const handleBarcodeScan = (data: string) => {
    onChangeText(data);
    void onSubmit(data);
  };

  const handleManualSubmit = () => {
    void onSubmit(value);
  };

  return (
    <View style={styles.container}>
      <FlatScanBanner prompt={prompt} detail={detail} />

      {successMessage && successColor ? (
        <StyledText variant="label" color={successColor} style={styles.success}>
          {successMessage}
        </StyledText>
      ) : null}

      {showViewport ? (
        <FlatScanViewport
          scanStep={scanStep}
          locationCode={locationCode}
          containerCode={containerCode}
          prompt={viewportPrompt}
          enabled={enabled}
          isLoading={isLoading}
          onBarcodeScan={handleBarcodeScan}
          variant={variant}
        />
      ) : null}

      <FlatScanInput
        value={value}
        onChangeText={onChangeText}
        onSubmit={handleManualSubmit}
        placeholder={inputPlaceholder}
      />

      {showConfirmButton || footerActions ? (
        <View style={styles.actions}>
          {showConfirmButton ? (
            <StyledButton
              title={confirmTitle}
              onPress={handleManualSubmit}
              variant={footerActions ? "medium" : "large"}
              loading={isLoading}
              disabled={!value.trim() || confirmDisabled}
              buttonStyles={[
                flatButton,
                styles.confirmButton,
                footerActions ? styles.confirmButtonInline : null,
              ]}
            />
          ) : null}
          {footerActions}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  success: {
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  banner: {
    overflow: "hidden",
  },
  bannerBand: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerBandText: {
    letterSpacing: 1.2,
  },
  bannerBody: {
    padding: 14,
    gap: 6,
  },
  bannerPrompt: {
    textAlign: "left",
  },
  viewport: {
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
  viewportPrompt: {
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
  input: {
    borderWidth: FLOOR_BORDER,
    fontFamily: "SpaceMonoRegular",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  confirmButton: {
    paddingVertical: 16,
  },
  confirmButtonInline: {
    flex: 1,
    paddingVertical: 14,
  },
});
