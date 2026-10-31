import { type Href, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DamageClaimApprovalPanel from "@/app/components/supervisor/DamageClaimApprovalPanel";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorDamageClaim } from "@/hooks/useSupervisorInventory";
import { formatDamageType } from "@/utils/supervisorInventory";

function parseClaimId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function SupervisorDamageClaimScreen() {
  const { claimId: rawClaimId } = useLocalSearchParams<{ claimId: string }>();
  const claimId = parseClaimId(rawClaimId);

  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  const { hasPermission } = useSupervisor();
  const canApprove = hasPermission("approve_damage_claims");

  const { claim, isLoading, isSubmitting, error, loadClaim, approveClaim } =
    useSupervisorDamageClaim(claimId);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadClaim();
  }, [loadClaim]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    Alert.alert("Damage claim approved", successMessage, [
      {
        text: "Back to tasks",
        onPress: () => router.replace("/main/supervisor/inventory" as Href),
      },
    ]);
  }, [successMessage]);

  const handleApprove = async (params: {
    liability: Parameters<typeof approveClaim>[0]["liability"];
    notes: string;
  }) => {
    const result = await approveClaim(params);
    if (result) {
      setSuccessMessage(result.message);
    }
    return Boolean(result);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            ← Inventory tasks
          </StyledText>
        </Pressable>

        <StyledText variant="display">Damage claim</StyledText>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={buttonColor} />
          </View>
        ) : null}

        {error ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${errorColor}14`, borderColor: `${errorColor}44` },
            ]}
          >
            <StyledText variant="body" color={errorColor}>
              {error}
            </StyledText>
          </View>
        ) : null}

        {claim ? (
          <>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <StyledText variant="monoSmall" color={successColor}>
                {claim.unitCode}
              </StyledText>
              <StyledText variant="headline">{claim.productName}</StyledText>
              {claim.sku ? (
                <StyledText variant="monoSmall" color={iconMuted}>
                  {claim.sku}
                </StyledText>
              ) : null}
              <StyledText variant="label" color={iconMuted}>
                {claim.locationDetail}
              </StyledText>
              <View style={styles.metaRow}>
                <ZoneBadge zone={claim.zone} />
                <StyledText variant="caption" color={iconMuted}>
                  {formatDamageType(claim.damageType)}
                </StyledText>
              </View>
            </View>

            <DamageClaimApprovalPanel
              claim={claim}
              canApprove={canApprove}
              isSubmitting={isSubmitting}
              error={error}
              onApprove={handleApprove}
            />
          </>
        ) : !isLoading && !error ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <StyledText variant="body" color={iconMuted}>
              Damage claim not found or already resolved.
            </StyledText>
          </View>
        ) : null}

        {successMessage ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: `${successColor}14`,
                borderColor: `${successColor}44`,
              },
            ]}
          >
            <StyledText variant="label" color={successColor}>
              {successMessage}
            </StyledText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 32,
    gap: 18,
  },
  backLink: {
    alignSelf: "flex-start",
  },
  loadingBlock: {
    paddingVertical: 24,
    alignItems: "center",
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
});
