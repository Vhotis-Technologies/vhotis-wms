import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { FLOOR_WORK_AREA_SECTIONS, formatFloorWorkArea } from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisorAssignments } from "@/hooks/useSupervisorAssignments";
import type {
  FloorWorkArea,
  SupervisorFloorStaffMember,
} from "@/interfaces/supervisor";

interface SupervisorFloorAssignmentPanelProps {
  member: SupervisorFloorStaffMember;
  canManage: boolean;
  onUpdated: () => void;
}

export default function SupervisorFloorAssignmentPanel({
  member,
  canManage,
  onUpdated,
}: SupervisorFloorAssignmentPanelProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const errorColor = useThemeColor({}, "error");
  const warningColor = useThemeColor({}, "warning");

  const [selectedArea, setSelectedArea] = useState<FloorWorkArea>(member.workArea);
  const [notes, setNotes] = useState("");

  const {
    isSubmitting,
    error,
    assignWorkArea,
    forceEndShift,
    clearError,
  } = useSupervisorAssignments();

  useEffect(() => {
    setSelectedArea(member.workArea);
    clearError();
  }, [member.workArea, clearError]);

  if (!canManage) {
    return null;
  }

  const handleAssignArea = async () => {
    if (selectedArea === member.workArea) {
      Alert.alert("No change", "Select a different work area to reassign.");
      return;
    }

    Alert.alert(
      "Assign work area",
      `Move ${member.employeeName} to ${formatFloorWorkArea(selectedArea)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Assign",
          onPress: async () => {
            const updated = await assignWorkArea({
              employeeId: member.employeeId,
              workArea: selectedArea,
              notes,
            });
            if (updated) {
              Alert.alert("Assigned", `${member.employeeName} moved to ${formatFloorWorkArea(selectedArea)}.`);
              onUpdated();
            }
          },
        },
      ],
    );
  };

  const handleForceEnd = () => {
    Alert.alert(
      "Force clock-out",
      `Clock out ${member.employeeName}? They will leave the floor roster until they sign in again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clock out",
          style: "destructive",
          onPress: async () => {
            const message = await forceEndShift({
              employeeId: member.employeeId,
              notes,
            });
            if (message) {
              Alert.alert("Clocked out", message, [
                { text: "OK", onPress: () => onUpdated() },
              ]);
            }
          },
        },
      ],
    );
  };

  return (
    <View
      style={[styles.panel, { backgroundColor: cardColor, borderColor }]}
    >
      <StyledText variant="eyebrow" color={iconMuted}>
        ASSIGNMENTS
      </StyledText>
      <StyledText variant="body" color={iconMuted}>
        Move this employee to another work area or force clock-out. Requires
        manage assignments permission.
      </StyledText>

      {error ? (
        <StyledText variant="label" color={errorColor}>
          {error}
        </StyledText>
      ) : null}

      {member.isOnJob ? (
        <StyledText variant="caption" color={warningColor}>
          Employee is on job {member.currentOrderId ?? member.currentFulfillmentJobId}.
          Reassign the job before changing work area.
        </StyledText>
      ) : null}

      <View style={styles.chipRow}>
        {FLOOR_WORK_AREA_SECTIONS.map((section) => {
          const active = selectedArea === section.id;
          return (
            <Pressable
              key={section.id}
              onPress={() => setSelectedArea(section.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? `${buttonColor}22` : cardColor,
                  borderColor: active ? buttonColor : borderColor,
                },
              ]}
            >
              <StyledText
                variant="caption"
                color={active ? buttonColor : iconMuted}
              >
                {section.label}
              </StyledText>
            </Pressable>
          );
        })}
      </View>

      <StyledTextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Supervisor notes (optional)"
        multiline
      />

      <StyledButton
        title="Assign work area"
        variant="medium"
        onPress={handleAssignArea}
        disabled={isSubmitting || member.isOnJob}
        buttonStyles={styles.actionButton}
      />

      <StyledButton
        title="Force clock-out"
        variant="medium"
        onPress={handleForceEnd}
        disabled={isSubmitting}
        buttonStyles={[
          styles.actionButton,
          { borderColor: `${warningColor}88`, backgroundColor: `${warningColor}12` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionButton: {
    width: "100%",
  },
});
