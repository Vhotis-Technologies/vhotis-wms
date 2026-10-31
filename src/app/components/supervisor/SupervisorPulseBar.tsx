import { type Href, router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import type { SupervisorPulseTile } from "@/interfaces/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";

interface SupervisorPulseBarProps {
  tiles: SupervisorPulseTile[];
  updatedLabel?: string;
  isLoading?: boolean;
}

export default function SupervisorPulseBar({
  tiles,
  updatedLabel,
  isLoading = false,
}: SupervisorPulseBarProps) {
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const buttonColor = useThemeColor({}, "button");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");

  const toneColor = (tone: SupervisorPulseTile["tone"] = "primary") => {
    switch (tone) {
      case "success":
        return successColor;
      case "warning":
        return warningColor;
      default:
        return buttonColor;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <StyledText variant="label" color={iconMuted}>
          Warehouse pulse
        </StyledText>
        {isLoading ? (
          <ActivityIndicator size="small" color={buttonColor} />
        ) : updatedLabel ? (
          <StyledText variant="caption" color={iconMuted}>
            {updatedLabel}
          </StyledText>
        ) : null}
      </View>

      <View style={styles.grid}>
        {tiles.map((tile) => {
          const color = toneColor(tile.tone);
          const isPressable = Boolean(tile.route) && !tile.disabled;

          return (
            <Pressable
              key={tile.id}
              disabled={!isPressable}
              onPress={() => {
                if (tile.route) {
                  router.push(tile.route as Href);
                }
              }}
              style={({ pressed }) => [
                styles.tile,
                {
                  backgroundColor: cardColor,
                  borderColor,
                  opacity: tile.disabled ? 0.72 : pressed && isPressable ? 0.9 : 1,
                },
              ]}
            >
              <StyledText variant="display" color={color} style={styles.value}>
                {tile.value}
              </StyledText>
              <StyledText variant="caption" color={iconMuted} style={styles.label}>
                {tile.label}
              </StyledText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    width: "31%",
    minWidth: 96,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 24,
  },
  label: {
    textAlign: "center",
  },
});
