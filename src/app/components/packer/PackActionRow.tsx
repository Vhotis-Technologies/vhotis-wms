import { StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import { useThemeColor } from "@/hooks/useThemeColor";

interface PackActionRowProps {
  mode: "labelReady" | "dispatch";
  onPrintLabel?: () => void;
  onContinue?: () => void;
  onSendDispatch?: () => void;
  onReprint?: () => void;
  printDisabled?: boolean;
  loading?: boolean;
}

export default function PackActionRow({
  mode,
  onPrintLabel,
  onContinue,
  onSendDispatch,
  onReprint,
  printDisabled,
  loading,
}: PackActionRowProps) {
  const borderColor = useThemeColor({}, "borders");
  const textColor = useThemeColor({}, "text");

  if (mode === "dispatch") {
    return (
      <View style={styles.container}>
        <StyledButton
          title="Send to dispatch bay →"
          onPress={onSendDispatch ?? (() => {})}
          variant="large"
          loading={loading}
          buttonStyles={styles.primaryButton}
        />
        <StyledButton
          title="🖨 Reprint label"
          onPress={onReprint ?? (() => {})}
          variant="tonal"
          buttonStyles={[styles.secondaryButton, { borderColor: borderColor }]}
          textStyles={{ color: textColor, fontWeight: "600" }}
        />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <StyledButton
        title="🖨 Print label"
        onPress={onPrintLabel ?? (() => {})}
        variant="tonal"
        disabled={printDisabled}
        loading={loading}
        buttonStyles={[styles.halfButton, { borderColor: borderColor }]}
        textStyles={{ color: textColor, fontWeight: "600" }}
      />
      <StyledButton
        title="Seal & label →"
        onPress={onContinue ?? (() => {})}
        variant="large"
        disabled={printDisabled}
        buttonStyles={[styles.halfButton, styles.primaryButton]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 0,
    paddingVertical: 16,
  },
  secondaryButton: {
    borderRadius: 0,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  halfButton: {
    flex: 1,
    borderRadius: 0,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
});
