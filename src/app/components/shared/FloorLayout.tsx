import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { useFloorSession } from "@/hooks/useFloorSession";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { ZoneBadge as ZoneBadgeType } from "@/interfaces/picker";

import { flatButton, flatPanel, FLOOR_ACCENT_WIDTH, FLOOR_BORDER } from "./floorStyles";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function FloorChromeHeader() {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const { changeWorkArea } = useFloorSession();

  return (
    <Pressable
      onPress={changeWorkArea}
      style={[styles.chromeRow, { borderBottomColor: borderColor }]}
    >
      <MaterialIcons name="arrow-back" size={18} color={iconMuted} />
      <StyledText variant="label" color={iconMuted}>
        Change work area
      </StyledText>
    </Pressable>
  );
}

export function FloorChromeFooter() {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const textColor = useThemeColor({}, "text");
  const { signOut, isLoading } = useFloorSession();

  return (
    <StyledButton
      title="Sign out"
      variant="medium"
      onPress={signOut}
      disabled={isLoading}
      buttonStyles={[
        flatButton,
        styles.signOut,
        { borderColor, backgroundColor: cardColor, borderWidth: FLOOR_BORDER },
      ]}
      textStyles={{ color: textColor }}
    />
  );
}

interface FloorHubHeaderProps {
  employeeName: string;
  badgeLabel: string;
  titleBand: string;
  bandColor: string;
  bandTextColor?: string;
}

export function FloorHubHeader({
  employeeName,
  badgeLabel,
  titleBand,
  bandColor,
  bandTextColor = "#000000",
}: FloorHubHeaderProps) {
  const iconMuted = useThemeColor({}, "icons");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");

  return (
    <View style={[styles.hubHeader, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={[styles.hubTitleBand, { backgroundColor: bandColor }]}>
        <StyledText variant="eyebrow" style={[styles.hubTitleBandText, { color: bandTextColor }]}>
          {titleBand}
        </StyledText>
      </View>
      <View style={styles.hubBody}>
        <StyledText variant="caption" color={iconMuted}>
          {getGreeting()}
        </StyledText>
        <StyledText variant="display" color={textColor} style={styles.hubName}>
          {employeeName}
        </StyledText>
        <View style={[styles.dockTag, { borderColor }]}>
          <StyledText variant="monoSmall" color={iconMuted}>
            {badgeLabel}
          </StyledText>
        </View>
      </View>
    </View>
  );
}

export interface FloorStatItem {
  value: string | number;
  label: string;
  tone?: "success" | "warning" | "primary";
}

export function FloorStatGrid({ items }: { items: FloorStatItem[] }) {
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const buttonColor = useThemeColor({}, "button");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");

  const toneColor = (tone: FloorStatItem["tone"] = "primary") => {
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
    <View style={[styles.statGrid, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.statCell,
            index > 0 ? { borderLeftWidth: FLOOR_BORDER, borderLeftColor: borderColor } : null,
          ]}
        >
          <StyledText variant="display" color={toneColor(item.tone)} style={styles.statValue}>
            {item.value}
          </StyledText>
          <StyledText variant="caption" color={iconMuted} style={styles.statLabel}>
            {item.label}
          </StyledText>
        </View>
      ))}
    </View>
  );
}

export function FloorSectionBand({ title }: { title: string }) {
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const bandForeground = useThemeColor({}, "background");

  return (
    <View style={[styles.sectionBand, { borderColor, backgroundColor: textColor }]}>
      <StyledText variant="eyebrow" style={[styles.sectionBandText, { color: bandForeground }]}>
        {title}
      </StyledText>
    </View>
  );
}

export function FloorZoneTag({ zone }: { zone: ZoneBadgeType }) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const buttonColor = useThemeColor({}, "button");
  const isAmb = zone === "AMB";

  return (
    <View
      style={[
        styles.zoneTag,
        {
          borderColor,
          backgroundColor: isAmb ? borderColor : `${buttonColor}18`,
        },
      ]}
    >
      <StyledText variant="micro" color={isAmb ? iconMuted : buttonColor}>
        {zone}
      </StyledText>
    </View>
  );
}

interface FloorLineProgressProps {
  current: number;
  total: number;
  label: string;
  referenceId: string;
  subtitle: string;
}

export function FloorLineProgress({
  current,
  total,
  label,
  referenceId,
  subtitle,
}: FloorLineProgressProps) {
  const successColor = useThemeColor({}, "success");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const iconMuted = useThemeColor({}, "icons");
  const progress = total > 0 ? current / total : 0;

  return (
    <View style={[styles.lineProgress, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={styles.lineProgressTop}>
        <StyledText variant="eyebrow" color={iconMuted}>
          {label}
        </StyledText>
        <StyledText variant="monoSmall" color={successColor}>
          {current}/{total}
        </StyledText>
      </View>
      <StyledText variant="mono" color={successColor}>
        {referenceId}
      </StyledText>
      <StyledText variant="bodyMedium">{subtitle}</StyledText>
      <View style={[styles.progressTrack, { backgroundColor: borderColor }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: successColor,
              width: `${Math.min(progress * 100, 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

interface FloorItemPanelProps {
  productName: string;
  sku: string;
  sectionLabel?: string;
}

export function FloorItemPanel({
  productName,
  sku,
  sectionLabel = "SORT THIS ITEM",
}: FloorItemPanelProps) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const textColor = useThemeColor({}, "text");
  const bandForeground = useThemeColor({}, "background");

  return (
    <View style={[styles.itemPanel, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={[styles.itemPanelBand, { backgroundColor: textColor }]}>
        <StyledText variant="eyebrow" style={[styles.itemPanelBandText, { color: bandForeground }]}>
          {sectionLabel}
        </StyledText>
      </View>
      <View style={styles.itemPanelBody}>
        <StyledText variant="headline">{productName}</StyledText>
        <StyledText variant="monoSmall" color={iconMuted}>
          SKU · {sku}
        </StyledText>
      </View>
    </View>
  );
}

interface FloorQuantityStripProps {
  required: number;
  count: number;
  countLabel?: string;
}

export function FloorQuantityStrip({
  required,
  count,
  countLabel = "STORED",
}: FloorQuantityStripProps) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const successColor = useThemeColor({}, "success");

  return (
    <View style={[styles.quantityStrip, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={[styles.quantityCell, { borderRightColor: borderColor }]}>
        <StyledText variant="eyebrow" color={iconMuted}>
          REQUIRED
        </StyledText>
        <StyledText variant="stat" color={successColor}>
          {required}
        </StyledText>
      </View>
      <View style={styles.quantityCell}>
        <StyledText variant="eyebrow" color={iconMuted}>
          {countLabel}
        </StyledText>
        <StyledText variant="stat">{count}</StyledText>
      </View>
    </View>
  );
}

interface FloorLocationPanelProps {
  locationCode: string;
  locationDetail: string;
  sectionLabel?: string;
}

export function FloorLocationPanel({
  locationCode,
  locationDetail,
  sectionLabel = "PUTAWAY LOCATION",
}: FloorLocationPanelProps) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const buttonColor = useThemeColor({}, "button");
  const bandForeground = useThemeColor({}, "buttonText");

  return (
    <View style={[styles.locationPanel, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={[styles.locationBand, { backgroundColor: buttonColor }]}>
        <StyledText variant="eyebrow" style={[styles.locationBandText, { color: bandForeground }]}>
          {sectionLabel}
        </StyledText>
      </View>
      <View style={styles.locationBody}>
        <StyledText variant="hero">{locationCode}</StyledText>
        <StyledText variant="label" color={iconMuted}>
          {locationDetail}
        </StyledText>
      </View>
    </View>
  );
}

export function FloorStatusStripe({ color }: { color: string }) {
  return <View style={[styles.statusStripe, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  chromeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: FLOOR_BORDER,
  },
  signOut: {
    width: "100%",
    marginTop: 16,
  },
  hubHeader: {
    overflow: "hidden",
  },
  hubTitleBand: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hubTitleBandText: {
    letterSpacing: 1.4,
  },
  hubBody: {
    padding: 14,
    gap: 4,
  },
  hubName: {
    fontSize: 26,
  },
  dockTag: {
    alignSelf: "flex-start",
    borderWidth: FLOOR_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  statGrid: {
    flexDirection: "row",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 4,
  },
  statValue: {
    fontSize: 26,
  },
  statLabel: {
    textAlign: "center",
  },
  sectionBand: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: FLOOR_BORDER,
    marginTop: 8,
  },
  sectionBandText: {
    letterSpacing: 1.4,
  },
  zoneTag: {
    borderWidth: FLOOR_BORDER,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lineProgress: {
    padding: 14,
    gap: 6,
    marginBottom: 12,
  },
  lineProgressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTrack: {
    height: 6,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  itemPanel: {
    overflow: "hidden",
    marginBottom: 12,
  },
  itemPanelBand: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  itemPanelBandText: {
    letterSpacing: 1.2,
  },
  itemPanelBody: {
    padding: 14,
    gap: 6,
  },
  quantityStrip: {
    flexDirection: "row",
    marginBottom: 12,
  },
  quantityCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
    borderRightWidth: FLOOR_BORDER,
  },
  locationPanel: {
    overflow: "hidden",
    marginBottom: 12,
  },
  locationBand: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  locationBandText: {
    letterSpacing: 1.2,
  },
  locationBody: {
    padding: 14,
    gap: 6,
  },
  statusStripe: {
    width: FLOOR_ACCENT_WIDTH,
    alignSelf: "stretch",
  },
});
