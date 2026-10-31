import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorRecountTask } from "@/interfaces/supervisor";
import { recountTaskSubtitle } from "@/utils/supervisorInventory";

interface InventoryRecountCardProps {
  task: SupervisorRecountTask;
  onPress: () => void;
}

export default function InventoryRecountCard({
  task,
  onPress,
}: InventoryRecountCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const warningColor = useThemeColor({}, "warning");
  const successColor = useThemeColor({}, "success");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: `${warningColor}88`,
          borderWidth: 1.5,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="monoSmall" color={successColor}>
          Recount · {task.fulfillmentRequestId}
        </StyledText>
        <View
          style={[styles.waitBadge, { backgroundColor: `${warningColor}18` }]}
        >
          <StyledText variant="caption" color={warningColor}>
            Pending count
          </StyledText>
        </View>
      </View>

      <StyledText variant="headline" style={styles.title}>
        {task.productName}
      </StyledText>

      {task.sku ? (
        <StyledText variant="monoSmall" color={iconMuted}>
          {task.sku}
        </StyledText>
      ) : null}

      <StyledText variant="label" color={iconMuted}>
        {recountTaskSubtitle(task)}
      </StyledText>

      <View style={styles.footer}>
        <ZoneBadge zone={task.zone} />
        {task.resolvedByName ? (
          <StyledText variant="caption" color={iconMuted}>
            Ordered by {task.resolvedByName}
          </StyledText>
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
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
});
