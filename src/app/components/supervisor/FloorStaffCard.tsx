import { type Href, router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import {
  formatFloorStaffStatus,
  formatFloorWorkArea,
  formatShiftDuration,
  supervisorFloorEmployeeHref,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorFloorStaffMember } from "@/interfaces/supervisor";

interface FloorStaffCardProps {
  member: SupervisorFloorStaffMember;
  onPress?: () => void;
}

export default function FloorStaffCard({ member, onPress }: FloorStaffCardProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");

  const statusLabel = formatFloorStaffStatus(member);
  const statusColor = member.isOnBreak
    ? warningColor
    : member.isOnJob
      ? buttonColor
      : successColor;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(supervisorFloorEmployeeHref(member.employeeId) as Href);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: member.isOnBreak ? `${warningColor}66` : borderColor,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="bodyMedium">{member.employeeName}</StyledText>
        <StyledText variant="caption" color={statusColor}>
          {statusLabel}
        </StyledText>
      </View>
      <StyledText variant="monoSmall" color={iconMuted}>
        {member.employeeId}
      </StyledText>
      <StyledText variant="caption" color={iconMuted}>
        {formatFloorWorkArea(member.workArea)} · {formatShiftDuration(member.shiftMinutes)}
      </StyledText>
      {member.totalExceptionsRaised > 0 ? (
        <StyledText variant="caption" color={warningColor}>
          {member.totalExceptionsRaised} exception
          {member.totalExceptionsRaised === 1 ? "" : "s"} this shift
        </StyledText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
});
