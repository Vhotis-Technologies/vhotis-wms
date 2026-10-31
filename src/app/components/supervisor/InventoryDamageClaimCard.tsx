import { Image, Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorDamageClaimTask } from "@/interfaces/supervisor";
import { damageClaimSubtitle } from "@/utils/supervisorInventory";

interface InventoryDamageClaimCardProps {
  claim: SupervisorDamageClaimTask;
  onPress: () => void;
}

export default function InventoryDamageClaimCard({
  claim,
  onPress,
}: InventoryDamageClaimCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");

  const thumbnail = claim.photoEvidenceUrls[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: `${errorColor}88`,
          borderWidth: 1.5,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="monoSmall" color={successColor}>
          {claim.unitCode}
        </StyledText>
        <View
          style={[styles.waitBadge, { backgroundColor: `${errorColor}18` }]}
        >
          <StyledText variant="caption" color={errorColor}>
            Needs approval
          </StyledText>
        </View>
      </View>

      <StyledText variant="headline" style={styles.title}>
        {claim.productName}
      </StyledText>

      {claim.sku ? (
        <StyledText variant="monoSmall" color={iconMuted}>
          {claim.sku}
        </StyledText>
      ) : null}

      <StyledText variant="label" color={iconMuted}>
        {damageClaimSubtitle(claim)}
      </StyledText>

      <View style={styles.footer}>
        <ZoneBadge zone={claim.zone} />
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  waitBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  title: {
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#1a1a1a20",
  },
});
