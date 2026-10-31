import { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import RelocateLocationSheet from "@/app/components/supervisor/RelocateLocationSheet";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { useThemeColor } from "@/hooks/useThemeColor";
import type {
  PickExceptionSummary,
  SupervisorExceptionResolution,
} from "@/interfaces/supervisor";
import {
  getResolutionOptionsForType,
  validateResolutionSubmit,
  type ExceptionResolutionOption,
} from "@/utils/supervisorResolution";

interface ExceptionResolutionPanelProps {
  exception: PickExceptionSummary;
  warehouseId: number;
  canApprove: boolean;
  isResolving: boolean;
  error?: string | null;
  onResolve: (params: {
    resolution: SupervisorExceptionResolution;
    notes: string;
    newLocationId?: number;
  }) => Promise<boolean>;
}

export default function ExceptionResolutionPanel({
  exception,
  warehouseId,
  canApprove,
  isResolving,
  error,
  onResolve,
}: ExceptionResolutionPanelProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const errorColor = useThemeColor({}, "error");
  const buttonColor = useThemeColor({}, "button");

  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [relocateVisible, setRelocateVisible] = useState(false);
  const [pendingRelocateOption, setPendingRelocateOption] =
    useState<ExceptionResolutionOption | null>(null);

  const options = useMemo(
    () => getResolutionOptionsForType(exception.exceptionType),
    [exception.exceptionType],
  );

  const executeResolution = async (
    option: ExceptionResolutionOption,
    newLocationId?: number,
  ) => {
    const validationMessage = validateResolutionSubmit({
      option,
      notes,
      newLocationId,
    });
    if (validationMessage) {
      setValidationError(validationMessage);
      return false;
    }

    setValidationError(null);
    return onResolve({
      resolution: option.resolution,
      notes: notes.trim(),
      newLocationId,
    });
  };

  const submitResolution = async (option: ExceptionResolutionOption) => {
    if (option.requiresRelocate) {
      setPendingRelocateOption(option);
      setRelocateVisible(true);
      return;
    }

    const run = async () => executeResolution(option);

    if (!option.requiresConfirm) {
      await run();
      return;
    }

    Alert.alert(
      option.destructive ? "Confirm resolution" : "Apply resolution",
      option.description,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: option.destructive ? "Confirm" : "Apply",
          style: option.destructive ? "destructive" : "default",
          onPress: () => {
            void run();
          },
        },
      ],
    );
  };

  const handleRelocateConfirm = async (locationId: number) => {
    if (!pendingRelocateOption) {
      return;
    }

    const success = await executeResolution(pendingRelocateOption, locationId);
    if (success) {
      setRelocateVisible(false);
      setPendingRelocateOption(null);
    }
  };

  if (!exception.isPending) {
    return (
      <View
        style={[styles.card, { backgroundColor: cardColor, borderColor }]}
      >
        <StyledText variant="headline">Already resolved</StyledText>
        <StyledText variant="body" color={iconMuted}>
          This exception is no longer pending supervisor review.
        </StyledText>
      </View>
    );
  }

  if (!canApprove) {
    return (
      <View
        style={[styles.card, { backgroundColor: cardColor, borderColor }]}
      >
        <StyledText variant="headline">Read-only</StyledText>
        <StyledText variant="body" color={iconMuted}>
          Your profile cannot approve pick exceptions.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[styles.card, { backgroundColor: cardColor, borderColor }]}
      >
        <StyledText variant="headline">Supervisor notes</StyledText>
        <StyledText variant="body" color={iconMuted}>
          Optional for most actions. Required when cancelling a line or ordering
          a recount.
        </StyledText>
        <StyledTextInput
          label="Notes"
          value={notes}
          onChangeText={(value) => {
            setNotes(value);
            if (validationError) {
              setValidationError(null);
            }
          }}
          placeholder="What did you verify on the floor?"
          multiline
          numberOfLines={4}
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

      <View style={styles.actions}>
        {options.map((option) => (
          <View key={option.resolution} style={styles.actionBlock}>
            <StyledText variant="bodyMedium">{option.label}</StyledText>
            <StyledText variant="caption" color={iconMuted}>
              {option.description}
            </StyledText>
            <StyledButton
              title={option.label}
              variant="medium"
              disabled={isResolving}
              onPress={() => submitResolution(option)}
              buttonStyles={[
                styles.actionButton,
                {
                  backgroundColor: option.destructive
                    ? `${errorColor}18`
                    : buttonColor,
                  borderWidth: option.destructive ? 1 : 0,
                  borderColor: option.destructive ? errorColor : "transparent",
                },
              ]}
            />
          </View>
        ))}
      </View>

      <RelocateLocationSheet
        visible={relocateVisible}
        exception={exception}
        warehouseId={warehouseId}
        notes={notes}
        loading={isResolving}
        onClose={() => {
          if (!isResolving) {
            setRelocateVisible(false);
            setPendingRelocateOption(null);
          }
        }}
        onConfirm={handleRelocateConfirm}
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
  actions: {
    gap: 14,
  },
  actionBlock: {
    gap: 6,
  },
  actionButton: {
    width: "100%",
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
  },
});
