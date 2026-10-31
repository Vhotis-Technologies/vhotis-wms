import { StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { flatButton, flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PackJobDetail } from "@/interfaces/packer";
import {
  getPackDispatchDetail,
  getPackDispatchMessage,
} from "@/utils/packJob";

interface PackDispatchBannerProps {
  job: PackJobDetail;
  notice?: string | null;
  onSendDispatch: () => void;
  onBackToQueue: () => void;
  loading?: boolean;
}

export default function PackDispatchBanner({
  job,
  notice,
  onSendDispatch,
  onBackToQueue,
  loading = false,
}: PackDispatchBannerProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const textColor = useThemeColor({}, "text");

  return (
    <View style={[styles.banner, flatPanel, { backgroundColor: cardColor, borderColor: successColor }]}>
      <View style={[styles.band, { backgroundColor: successColor }]}>
        <StyledText variant="eyebrow" style={styles.bandText}>
          READY FOR DISPATCH BAY
        </StyledText>
      </View>
      <View style={styles.body}>
        <StyledText variant="body" color={iconMuted}>
          {getPackDispatchMessage(job)}
        </StyledText>
        <StyledText variant="caption" color={iconMuted}>
          {getPackDispatchDetail(job)}
        </StyledText>
        {notice ? (
          <StyledText variant="label" color={successColor}>
            {notice}
          </StyledText>
        ) : null}
        <StyledButton
          title="Send to dispatch bay →"
          onPress={onSendDispatch}
          variant="large"
          loading={loading}
          buttonStyles={[flatButton, styles.primaryButton]}
        />
        <StyledButton
          title="Back to pack queue"
          onPress={onBackToQueue}
          variant="tonal"
          buttonStyles={[
            flatButton,
            styles.secondaryButton,
            { borderColor, backgroundColor: cardColor, borderWidth: FLOOR_BORDER },
          ]}
          textStyles={{ color: textColor }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    overflow: "hidden",
    marginBottom: 12,
  },
  band: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bandText: {
    color: "#000000",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  body: {
    padding: 14,
    gap: 10,
  },
  primaryButton: {
    paddingVertical: 14,
    marginTop: 4,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
});
