import { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { useThemeColor } from "@/hooks/useThemeColor";
import type {
  SupervisorInboundVarianceLine,
  SupervisorInboundVarianceResolution,
} from "@/interfaces/supervisor";
import {
  getInboundResolutionOptions,
  validateInboundResolutionSubmit,
  type InboundVarianceResolutionOption,
} from "@/utils/supervisorInbound";

interface InboundVarianceResolutionPanelProps {
  line: SupervisorInboundVarianceLine;
  canApprove: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onResolve: (params: {
    resolution: SupervisorInboundVarianceResolution;
    notes: string;
  }) => Promise<boolean>;
}

export default function InboundVarianceResolutionPanel({
  line,
  canApprove,
  isSubmitting,
  error,
  onResolve,
}: InboundVarianceResolutionPanelProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const errorColor = useThemeColor({}, "error");
  const buttonColor = useThemeColor({}, "button");

  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const options = useMemo(() => getInboundResolutionOptions(line), [line]);

  const executeResolution = async (option: InboundVarianceResolutionOption) => {
    const validationMessage = validateInboundResolutionSubmit({ option, notes });
    if (validationMessage) {
      setValidationError(validationMessage);
      return false;
    }

    setValidationError(null);
    return onResolve({
      resolution: option.resolution,
      notes: notes.trim(),
    });
  };

  const submitResolution = async (option: InboundVarianceResolutionOption) => {
    const run = async () => executeResolution(option);

    if (!option.requiresConfirm) {
      await run();
      return;
    }

    Alert.alert(
      option.destructive ? "Confirm rejection" : "Apply resolution",
      option.description,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: option.destructive ? "Reject line" : "Apply",
          style: option.destructive ? "destructive" : "default",
          onPress: () => {
            void run();
          },
        },
      ],
    );
  };

  if (!line.needsApproval) {
    return (
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Variance cleared</StyledText>
        <StyledText variant="body" color={iconMuted}>
          This receipt line no longer needs supervisor approval.
        </StyledText>
      </View>
    );
  }

  if (!canApprove) {
    return (
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Read-only</StyledText>
        <StyledText variant="body" color={iconMuted}>
          Your profile cannot approve inbound shipments.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Supervisor notes</StyledText>
        <StyledText variant="body" color={iconMuted}>
          Optional for accept/reject. Required when ordering a recount.
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
          placeholder="What did you verify on the dock?"
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
              disabled={isSubmitting}
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
