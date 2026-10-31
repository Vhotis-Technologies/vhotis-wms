import { type Href, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InboundVarianceLineCard from "@/app/components/supervisor/InboundVarianceLineCard";
import InboundVarianceResolutionPanel from "@/app/components/supervisor/InboundVarianceResolutionPanel";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { formatShipmentStatus } from "@/constants/sorter";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorInboundApproval } from "@/hooks/useSupervisorInbound";
import type { InboundShipmentStatus } from "@/interfaces/sorter";
import type { SupervisorInboundVarianceLine } from "@/interfaces/supervisor";
import { formatInboundDeliveryMethod } from "@/utils/supervisorInbound";

function parseShipmentId(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ? value.trim() : null;
}

export default function SupervisorInboundApprovalDetailScreen() {
  const { shipmentId: rawShipmentId } = useLocalSearchParams<{
    shipmentId: string;
  }>();
  const shipmentId = parseShipmentId(rawShipmentId);

  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const warningColor = useThemeColor({}, "warning");

  const { hasPermission } = useSupervisor();
  const canApprove = hasPermission("approve_inbound_shipments");

  const {
    approval,
    isLoading,
    isSubmitting,
    error,
    loadApproval,
    approveVariance,
    completeReceiving,
  } = useSupervisorInboundApproval(shipmentId);

  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadApproval();
  }, [loadApproval]);

  const varianceLines = approval?.varianceLines ?? [];
  const pendingLines = useMemo(
    () => varianceLines.filter((line) => line.needsApproval),
    [varianceLines],
  );

  const selectedLine = useMemo<SupervisorInboundVarianceLine | null>(() => {
    if (selectedLineId != null) {
      return (
        varianceLines.find((line) => line.id === selectedLineId) ??
        pendingLines[0] ??
        null
      );
    }
    return pendingLines[0] ?? null;
  }, [pendingLines, selectedLineId, varianceLines]);

  useEffect(() => {
    if (pendingLines.length === 0) {
      setSelectedLineId(null);
      return;
    }
    if (
      selectedLineId == null ||
      !pendingLines.some((line) => line.id === selectedLineId)
    ) {
      setSelectedLineId(pendingLines[0].id);
    }
  }, [pendingLines, selectedLineId]);

  const canCompleteReceiving = Boolean(
    approval &&
      canApprove &&
      approval.pendingVarianceCount === 0 &&
      (approval.needsSignOff ||
        approval.status === "receiving" ||
        approval.status === "partial_received"),
  );

  const handleResolveVariance = useCallback(
    async (params: {
      resolution: Parameters<typeof approveVariance>[0]["resolution"];
      notes: string;
    }) => {
      if (!selectedLine) {
        return false;
      }

      const result = await approveVariance({
        receiptLineId: selectedLine.id,
        resolution: params.resolution,
        notes: params.notes,
      });

      if (result) {
        setSuccessMessage(result.message);
      }

      return Boolean(result);
    },
    [approveVariance, selectedLine],
  );

  const handleCompleteReceiving = () => {
    Alert.alert(
      "Complete receiving",
      "Close receiving for this shipment and move it off the dock queue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => {
            void (async () => {
              const result = await completeReceiving(completeNotes.trim());
              if (!result) {
                return;
              }

              setSuccessMessage(result.message);
              Alert.alert("Receiving closed", result.message, [
                {
                  text: "Back to inbox",
                  onPress: () =>
                    router.replace("/main/supervisor/inbound" as Href),
                },
              ]);
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            ← Inbound approvals
          </StyledText>
        </Pressable>

        <StyledText variant="display">{shipmentId ?? "—"}</StyledText>

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

        {approval ? (
          <>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <StyledText variant="headline">{approval.sellerStoreName}</StyledText>
              {approval.sellerName ? (
                <StyledText variant="bodyMedium" color={iconMuted}>
                  {approval.sellerName}
                </StyledText>
              ) : null}
              <StyledText variant="label" color={iconMuted}>
                {formatInboundDeliveryMethod(approval.deliveryMethod)} ·{" "}
                {formatShipmentStatus(approval.status as InboundShipmentStatus)}
              </StyledText>
              <StyledText variant="caption" color={iconMuted}>
                {approval.manifestLineCount} manifest lines ·{" "}
                {approval.pendingVarianceCount} pending variance
                {approval.pendingVarianceCount === 1 ? "" : "s"}
              </StyledText>
              {approval.referenceNotes ? (
                <StyledText variant="caption" color={iconMuted} style={styles.notes}>
                  {approval.referenceNotes}
                </StyledText>
              ) : null}
            </View>

            {approval.pendingVarianceCount > 0 ? (
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: `${warningColor}14`,
                    borderColor: `${warningColor}44`,
                  },
                ]}
              >
                <StyledText variant="label" color={warningColor}>
                  Resolve pending variances before completing receiving.
                </StyledText>
              </View>
            ) : approval.needsSignOff ? (
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
                  Variances cleared — ready for supervisor sign-off.
                </StyledText>
              </View>
            ) : null}

            {varianceLines.length > 0 ? (
              <View style={styles.section}>
                <StyledText variant="headline">Variance lines</StyledText>
                <View style={styles.lineList}>
                  {varianceLines.map((line) => (
                    <Pressable
                      key={line.id}
                      onPress={() => {
                        if (line.needsApproval) {
                          setSelectedLineId(line.id);
                        }
                      }}
                      disabled={!line.needsApproval}
                    >
                      <InboundVarianceLineCard
                        line={line}
                        highlight={selectedLine?.id === line.id}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {selectedLine ? (
              <InboundVarianceResolutionPanel
                line={selectedLine}
                canApprove={canApprove}
                isSubmitting={isSubmitting}
                error={error}
                onResolve={handleResolveVariance}
              />
            ) : null}

            {canCompleteReceiving ? (
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: cardColor, borderColor },
                ]}
              >
                <StyledText variant="headline">Complete receiving</StyledText>
                <StyledText variant="body" color={iconMuted}>
                  Supervisor override to close receiving when dock staff cannot
                  finish the shipment.
                </StyledText>
                <StyledTextInput
                  label="Close notes"
                  value={completeNotes}
                  onChangeText={setCompleteNotes}
                  placeholder="Optional notes for audit trail"
                  multiline
                  numberOfLines={3}
                />
                <StyledButton
                  title="Complete receiving"
                  variant="medium"
                  disabled={isSubmitting}
                  onPress={handleCompleteReceiving}
                  buttonStyles={[
                    styles.completeButton,
                    { backgroundColor: buttonColor },
                  ]}
                />
              </View>
            ) : null}
          </>
        ) : !isLoading && !error ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <StyledText variant="body" color={iconMuted}>
              Shipment not found or no longer open for inbound approval.
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
  notes: {
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  lineList: {
    gap: 10,
  },
  completeButton: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
  },
});
