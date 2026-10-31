import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorRecountTask } from "@/interfaces/supervisor";
import { validateRecountSubmit } from "@/utils/supervisorInventory";

interface RecountConfirmationPanelProps {
  task: SupervisorRecountTask;
  canOverride: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onConfirm: (params: { countedQty: number; notes: string }) => Promise<boolean>;
}

export default function RecountConfirmationPanel({
  task,
  canOverride,
  isSubmitting,
  error,
  onConfirm,
}: RecountConfirmationPanelProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const errorColor = useThemeColor({}, "error");
  const buttonColor = useThemeColor({}, "button");
  const warningColor = useThemeColor({}, "warning");

  const [countedQty, setCountedQty] = useState(
    String(task.quantityOnHand > 0 ? task.quantityOnHand : task.quantityFound),
  );
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleConfirm = () => {
    const validationMessage = validateRecountSubmit({
      countedQty,
      quantityReserved: task.quantityReserved,
    });
    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    setValidationError(null);
    const parsedQty = Number.parseInt(countedQty, 10);

    Alert.alert(
      "Confirm location count",
      `Update system stock to ${parsedQty} at ${task.locationCode}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            void onConfirm({ countedQty: parsedQty, notes: notes.trim() });
          },
        },
      ],
    );
  };

  if (!canOverride) {
    return (
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Read-only</StyledText>
        <StyledText variant="body" color={iconMuted}>
          Your profile cannot override stock counts.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Physical count</StyledText>
        <StyledText variant="body" color={iconMuted}>
          Enter what you verified on the floor. System currently shows{" "}
          {task.quantityOnHand} on hand with {task.quantityReserved} reserved.
        </StyledText>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <StyledText variant="caption" color={iconMuted}>
              System on hand
            </StyledText>
            <StyledText variant="bodyMedium">{task.quantityOnHand}</StyledText>
          </View>
          <View style={styles.statCell}>
            <StyledText variant="caption" color={iconMuted}>
              Picker found
            </StyledText>
            <StyledText variant="bodyMedium">{task.quantityFound}</StyledText>
          </View>
          <View style={styles.statCell}>
            <StyledText variant="caption" color={iconMuted}>
              Reserved
            </StyledText>
            <StyledText variant="bodyMedium" color={warningColor}>
              {task.quantityReserved}
            </StyledText>
          </View>
        </View>

        <StyledTextInput
          label="Counted quantity"
          value={countedQty}
          onChangeText={(value) => {
            setCountedQty(value.replace(/[^\d]/g, ""));
            if (validationError) {
              setValidationError(null);
            }
          }}
          keyboardType="number-pad"
          placeholder="Units at location"
        />

        <StyledTextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="What did you verify?"
          multiline
          numberOfLines={3}
        />
      </View>

      {validationError ? (
        <StyledText variant="label" color={errorColor}>
          {validationError}
        </StyledText>
      ) : null}

      {error ? (
        <StyledText variant="label" color={errorColor}>
          {error}
        </StyledText>
      ) : null}

      <StyledButton
        title="Confirm location count"
        variant="medium"
        disabled={isSubmitting}
        onPress={handleConfirm}
        buttonStyles={[styles.actionButton, { backgroundColor: buttonColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCell: {
    minWidth: "28%",
    gap: 2,
  },
  actionButton: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
  },
});
