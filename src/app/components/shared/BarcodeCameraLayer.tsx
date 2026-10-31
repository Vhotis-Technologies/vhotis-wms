import { MaterialIcons } from "@expo/vector-icons";
import {
  CameraView,
  type BarcodeScanningResult,
  type BarcodeSettings,
} from "expo-camera";
import { StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

interface BarcodeCameraLayerProps {
  scannerProps: {
    onBarcodeScanned?: (result: BarcodeScanningResult) => void;
    barcodeScannerSettings?: BarcodeSettings;
  };
  permissionGranted: boolean;
  permissionDenied: boolean;
  permissionPending: boolean;
  onRequestPermission: () => void;
}

export default function BarcodeCameraLayer({
  scannerProps,
  permissionGranted,
  permissionDenied,
  permissionPending,
  onRequestPermission,
}: BarcodeCameraLayerProps) {
  const bgColor = useThemeColor({}, "background");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");

  if (permissionPending) {
    return (
      <View style={[styles.fallback, { backgroundColor: bgColor }]}>
        <StyledText variant="caption" color={iconMuted}>
          Checking camera access…
        </StyledText>
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View
        style={[
          styles.fallback,
          styles.permissionBlock,
          { backgroundColor: cardColor, borderColor },
        ]}
      >
        <MaterialIcons name="photo-camera" size={28} color={iconMuted} />
        <StyledText variant="caption" color={iconMuted} style={styles.permissionCopy}>
          {permissionDenied
            ? "Camera access is off. Enable it to scan barcodes, or enter the code below."
            : "Camera access is required to scan barcodes."}
        </StyledText>
        <StyledButton
          title="Enable camera"
          variant="medium"
          onPress={onRequestPermission}
          buttonStyles={[
            styles.permissionButton,
            { backgroundColor: buttonColor, borderWidth: 0 },
          ]}
        />
      </View>
    );
  }

  return (
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="back"
      onBarcodeScanned={scannerProps.onBarcodeScanned}
      barcodeScannerSettings={scannerProps.barcodeScannerSettings}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  permissionBlock: {
    borderWidth: 1,
    gap: 10,
  },
  permissionCopy: {
    textAlign: "center",
    lineHeight: 18,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
