import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisorAssignments } from "@/hooks/useSupervisorAssignments";
import type {
  SupervisorAssignableStaffMember,
  SupervisorJobDetail,
} from "@/interfaces/supervisor";

interface SupervisorJobReassignPanelProps {
  job: SupervisorJobDetail;
  canManage: boolean;
  onUpdated: () => void;
}

function StaffPicker({
  staff,
  selectedId,
  onSelect,
  isLoading,
}: {
  staff: SupervisorAssignableStaffMember[];
  selectedId: string | null;
  onSelect: (employeeId: string) => void;
  isLoading: boolean;
}) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");

  if (isLoading) {
    return <ActivityIndicator color={buttonColor} />;
  }

  if (staff.length === 0) {
    return (
      <StyledText variant="body" color={iconMuted}>
        No clocked-in staff available in this work area.
      </StyledText>
    );
  }

  return (
    <View style={styles.staffList}>
      {staff.map((row) => {
        const active = selectedId === row.employeeId;
        return (
          <Pressable
            key={row.employeeId}
            onPress={() => onSelect(row.employeeId)}
            style={[
              styles.staffRow,
              {
                backgroundColor: active ? `${buttonColor}14` : cardColor,
                borderColor: active ? buttonColor : borderColor,
              },
            ]}
          >
            <View style={styles.staffCopy}>
              <StyledText variant="bodyMedium">{row.employeeName}</StyledText>
              <StyledText variant="caption" color={iconMuted}>
                {row.employeeId}
                {row.currentOrderId ? ` · on ${row.currentOrderId}` : ""}
              </StyledText>
            </View>
            <StyledText
              variant="caption"
              color={row.isAvailable ? successColor : iconMuted}
            >
              {row.isAvailable ? "Available" : "Busy"}
            </StyledText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SupervisorJobReassignPanel({
  job,
  canManage,
  onUpdated,
}: SupervisorJobReassignPanelProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const errorColor = useThemeColor({}, "error");

  const [notes, setNotes] = useState("");
  const [selectedPickerId, setSelectedPickerId] = useState<string | null>(null);
  const [selectedPackerId, setSelectedPackerId] = useState<string | null>(null);
  const [pickStaff, setPickStaff] = useState<SupervisorAssignableStaffMember[]>([]);
  const [packStaff, setPackStaff] = useState<SupervisorAssignableStaffMember[]>([]);
  const [pickStaffLoading, setPickStaffLoading] = useState(false);
  const [packStaffLoading, setPackStaffLoading] = useState(false);

  const {
    isSubmitting,
    error,
    loadAssignableStaff,
    reassignPickJob,
    reassignPackJob,
    clearError,
  } = useSupervisorAssignments();

  const canReassignPicker =
    job.status === "reserved" || job.status === "picking";
  const canReassignPacker = job.showPack && !job.hasPendingExceptions;

  useEffect(() => {
    clearError();
    if (!canManage || !canReassignPicker) {
      setPickStaff([]);
      return;
    }

    setPickStaffLoading(true);
    void loadAssignableStaff("pick").then((rows) => {
      setPickStaff(rows);
      setPickStaffLoading(false);
    });
  }, [canManage, canReassignPicker, loadAssignableStaff, clearError]);

  useEffect(() => {
    if (!canManage || !canReassignPacker) {
      setPackStaff([]);
      return;
    }

    setPackStaffLoading(true);
    void loadAssignableStaff("pack").then((rows) => {
      setPackStaff(rows);
      setPackStaffLoading(false);
    });
  }, [canManage, canReassignPacker, loadAssignableStaff]);

  if (!canManage) {
    return null;
  }

  if (!canReassignPicker && !canReassignPacker) {
    return null;
  }

  const handleReassignPicker = () => {
    if (!selectedPickerId) {
      Alert.alert("Select picker", "Choose a picker from the pick floor roster.");
      return;
    }

    Alert.alert(
      "Reassign picker",
      `Assign ${selectedPickerId} to order ${job.orderId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reassign",
          onPress: async () => {
            const updated = await reassignPickJob({
              jobId: job.id,
              pickerEmployeeId: selectedPickerId,
              notes,
            });
            if (updated) {
              Alert.alert("Picker reassigned", `Order ${job.orderId} updated.`);
              onUpdated();
            }
          },
        },
      ],
    );
  };

  const handleReassignPacker = () => {
    if (!selectedPackerId) {
      Alert.alert("Select packer", "Choose a packer from the pack station roster.");
      return;
    }

    Alert.alert(
      "Reassign packer",
      `Assign ${selectedPackerId} to pack order ${job.orderId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reassign",
          onPress: async () => {
            const updated = await reassignPackJob({
              jobId: job.id,
              packerEmployeeId: selectedPackerId,
              notes,
            });
            if (updated) {
              Alert.alert("Packer reassigned", `Order ${job.orderId} updated.`);
              onUpdated();
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
        JOB ASSIGNMENTS
      </StyledText>
      <StyledText variant="body" color={iconMuted}>
        Reassign picker or packer ownership. Staff must be clocked into the
        matching work area.
      </StyledText>

      {error ? (
        <StyledText variant="label" color={errorColor}>
          {error}
        </StyledText>
      ) : null}

      <StyledTextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Supervisor notes (optional)"
        multiline
      />

      {canReassignPicker ? (
        <View style={styles.section}>
          <StyledText variant="label">
            Picker · current {job.assignedPickerName || "Unassigned"}
          </StyledText>
          <StaffPicker
            staff={pickStaff}
            selectedId={selectedPickerId}
            onSelect={setSelectedPickerId}
            isLoading={pickStaffLoading}
          />
          <StyledButton
            title="Reassign picker"
            variant="medium"
            onPress={handleReassignPicker}
            disabled={isSubmitting}
            buttonStyles={styles.actionButton}
          />
        </View>
      ) : null}

      {canReassignPacker ? (
        <View style={styles.section}>
          <StyledText variant="label">
            Packer · current {job.assignedPackerName || "Unassigned"}
          </StyledText>
          <StaffPicker
            staff={packStaff}
            selectedId={selectedPackerId}
            onSelect={setSelectedPackerId}
            isLoading={packStaffLoading}
          />
          <StyledButton
            title="Reassign packer"
            variant="medium"
            onPress={handleReassignPacker}
            disabled={isSubmitting}
            buttonStyles={styles.actionButton}
          />
        </View>
      ) : null}
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
  section: {
    gap: 10,
  },
  staffList: {
    gap: 8,
  },
  staffRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  staffCopy: {
    flex: 1,
    gap: 2,
  },
  actionButton: {
    width: "100%",
  },
});
