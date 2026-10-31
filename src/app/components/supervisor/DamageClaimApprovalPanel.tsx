import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import ExceptionPhotoGallery from "@/app/components/supervisor/ExceptionPhotoGallery";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { useThemeColor } from "@/hooks/useThemeColor";
import type {
  SupervisorDamageClaimTask,
  SupervisorDamageLiability,
} from "@/interfaces/supervisor";
import {
  DAMAGE_LIABILITY_OPTIONS,
  formatDamageLiability,
  formatDamageType,
} from "@/utils/supervisorInventory";

interface DamageClaimApprovalPanelProps {
  claim: SupervisorDamageClaimTask;
  canApprove: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onApprove: (params: {
    liability: SupervisorDamageLiability;
    notes: string;
  }) => Promise<boolean>;
}

export default function DamageClaimApprovalPanel({
  claim,
  canApprove,
  isSubmitting,
  error,
  onApprove,
}: DamageClaimApprovalPanelProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const errorColor = useThemeColor({}, "error");
  const buttonColor = useThemeColor({}, "button");

  const [selectedLiability, setSelectedLiability] =
    useState<SupervisorDamageLiability>(claim.liability);
  const [notes, setNotes] = useState("");

  const submitApproval = (liability: SupervisorDamageLiability) => {
    Alert.alert(
      "Approve damage claim",
      `Mark unit ${claim.unitCode} as damaged with ${formatDamageLiability(liability).toLowerCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            void onApprove({ liability, notes: notes.trim() });
          },
        },
      ],
    );
  };

  if (claim.resolved) {
    return (
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Claim resolved</StyledText>
        <StyledText variant="body" color={iconMuted}>
          This damage claim has already been approved.
        </StyledText>
      </View>
    );
  }

  if (!canApprove) {
    return (
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Read-only</StyledText>
        <StyledText variant="body" color={iconMuted}>
          Your profile cannot approve damage claims.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Claim details</StyledText>
        <StyledText variant="body" color={iconMuted}>
          {formatDamageType(claim.damageType)} · {claim.quantityDamaged} damaged
        </StyledText>
        {claim.estimatedValue ? (
          <StyledText variant="label" color={iconMuted}>
            Estimated value · {claim.estimatedValue}
          </StyledText>
        ) : null}
        {claim.notes ? (
          <StyledText variant="body">{claim.notes}</StyledText>
        ) : null}
      </View>

      <ExceptionPhotoGallery photoUrls={claim.photoEvidenceUrls} />

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <StyledText variant="headline">Liability</StyledText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionRow}>
            {DAMAGE_LIABILITY_OPTIONS.map((option) => {
              const active = selectedLiability === option.id;
              return (
                <StyledButton
                  key={option.id}
                  title={option.label}
                  variant="medium"
                  disabled={isSubmitting}
                  onPress={() => setSelectedLiability(option.id)}
                  buttonStyles={[
                    styles.optionButton,
                    {
                      backgroundColor: active ? buttonColor : `${iconMuted}12`,
                      borderColor: active ? buttonColor : borderColor,
                      borderWidth: 1,
                    },
                  ]}
                />
              );
            })}
          </View>
        </ScrollView>
        <StyledText variant="caption" color={iconMuted}>
          {
            DAMAGE_LIABILITY_OPTIONS.find(
              (option) => option.id === selectedLiability,
            )?.description
          }
        </StyledText>

        <StyledTextInput
          label="Supervisor notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional approval notes"
          multiline
          numberOfLines={3}
        />
      </View>

      {error ? (
        <StyledText variant="label" color={errorColor}>
          {error}
        </StyledText>
      ) : null}

      <StyledButton
        title="Approve damage claim"
        variant="medium"
        disabled={isSubmitting}
        onPress={() => submitApproval(selectedLiability)}
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
  optionRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  optionButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionButton: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
  },
});
