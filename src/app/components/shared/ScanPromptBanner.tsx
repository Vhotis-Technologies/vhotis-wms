import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

interface ScanPromptBannerProps {
  prompt: string;
  detail?: string;
}

export default function ScanPromptBanner({ prompt, detail }: ScanPromptBannerProps) {
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: cardColor, borderColor: borderColor },
      ]}
    >
      <StyledText
        variant="bodyMedium"
        color={iconMuted}
        style={styles.prompt}
      >
        {prompt}
      </StyledText>
      {detail ? (
        <StyledText variant="monoSmall" color={successColor} style={styles.detail}>
          {detail}
        </StyledText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 4,
  },
  prompt: {
    textAlign: "center",
  },
  detail: {
    textAlign: "center",
  },
});
