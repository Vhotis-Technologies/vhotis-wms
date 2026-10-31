import { StyleSheet, View } from "react-native";

import FloorStaffCard from "@/app/components/supervisor/FloorStaffCard";
import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import type {
  FloorWorkArea,
  SupervisorFloorStaffMember,
} from "@/interfaces/supervisor";

interface FloorStaffAreaSectionProps {
  area: FloorWorkArea;
  label: string;
  description: string;
  members: SupervisorFloorStaffMember[];
}

export default function FloorStaffAreaSection({
  area,
  label,
  description,
  members,
}: FloorStaffAreaSectionProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <StyledText variant="label">{label}</StyledText>
          <StyledText variant="caption" color={iconMuted}>
            {description}
          </StyledText>
        </View>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <StyledText variant="caption">{members.length}</StyledText>
        </View>
      </View>

      {members.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <StyledText variant="body" color={iconMuted}>
            No {area} staff clocked in right now.
          </StyledText>
        </View>
      ) : (
        <View style={styles.list}>
          {members.map((member) => (
            <FloorStaffCard key={member.shiftId} member={member} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  countBadge: {
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
  },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  list: {
    gap: 10,
  },
});
