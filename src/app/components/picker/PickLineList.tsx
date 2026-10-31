import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { FloorSectionBand } from "@/app/components/shared/FloorLayout";
import { flatPanel, FLOOR_ACCENT_WIDTH, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickLine } from "@/interfaces/picker";

interface PickLineListProps {
  lines: PickLine[];
}

function lineStatusLabel(line: PickLine): string | null {
  if (line.line_status === "short") return "Short pick approved";
  if (line.line_status === "cancelled") return "Line cancelled";
  if (line.status === "blocked") return "Awaiting supervisor";
  return null;
}

function stripeColor(
  line: PickLine,
  successColor: string,
  warningColor: string,
  borderColor: string,
) {
  if (line.status === "completed") return successColor;
  if (line.status === "active") return successColor;
  if (line.status === "blocked") return warningColor;
  return borderColor;
}

export default function PickLineList({ lines }: PickLineListProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");

  return (
    <View style={styles.container}>
      <FloorSectionBand title="PICK LINES" />
      <View style={[styles.listFrame, flatPanel, { borderColor }]}>
        {lines.map((line, index) => {
          const statusLabel = lineStatusLabel(line);
          const color = stripeColor(line, successColor, warningColor, borderColor);

          return (
            <View
              key={line.id}
              style={[
                styles.row,
                index > 0 ? { borderTopWidth: FLOOR_BORDER, borderTopColor: borderColor } : null,
                {
                  backgroundColor:
                    line.status === "completed" ? `${successColor}08` : cardColor,
                  opacity: line.status === "blocked" ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.stripe, { backgroundColor: color }]} />
              <View style={styles.content}>
                <StyledText variant="bodyMedium">{line.product_name}</StyledText>
                <StyledText variant="monoSmall" color={iconMuted}>
                  {line.location_code} · x{line.quantity_required}
                  {statusLabel ? ` · ${statusLabel}` : ""}
                </StyledText>
              </View>
              <View style={[styles.statusCol, { borderLeftColor: borderColor }]}>
                <StyledText variant="caption" color={color} style={styles.statusTag}>
                  {line.status === "completed"
                    ? "DONE"
                    : line.status === "active"
                      ? "ACTIVE"
                      : line.status === "blocked"
                        ? "HOLD"
                        : "OPEN"}
                </StyledText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  listFrame: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  stripe: {
    width: FLOOR_ACCENT_WIDTH,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  statusCol: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: FLOOR_BORDER,
    paddingHorizontal: 6,
  },
  statusTag: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
