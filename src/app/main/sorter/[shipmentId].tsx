import { type Href, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ManifestLineList from "@/app/components/sorter/ManifestLineList";
import ReceiptLineList from "@/app/components/sorter/ReceiptLineList";
import ReceiveLineSheet from "@/app/components/sorter/ReceiveLineSheet";
import ShipmentHeader from "@/app/components/sorter/ShipmentHeader";
import ShipmentReceivingProgress from "@/app/components/sorter/ShipmentReceivingProgress";
import { flatButton, flatPanel, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSorter } from "@/hooks/useSorter";
import { isArrivableShipmentStatus } from "@/constants/sorter";
import type { ManifestLine, ReceiptLineSummary } from "@/interfaces/sorter";
import {
  canCompleteReceiving,
  formatReceivingClosedStatus,
  isReceivingClosed,
} from "@/utils/sorterCompletion";

export default function ShipmentDetailScreen() {
  const bgColor = useThemeColor({}, "background");
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const textColor = useThemeColor({}, "text");

  const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();
  const [receiveTarget, setReceiveTarget] = useState<ManifestLine | null>(null);
  const [sheetSubmitting, setSheetSubmitting] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const {
    shipment,
    isLoading,
    error,
    loadShipment,
    receiveLine,
    markArrived,
    completeShipment,
  } = useSorter({
    shipmentId: typeof shipmentId === "string" ? shipmentId : undefined,
  });

  const goToLine = (line: ReceiptLineSummary) => {
    router.push(
      `/main/sorter/line/${line.id}?shipmentId=${line.shipment_id}` as Href,
    );
  };

  if (!shipment && isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={successColor} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!shipment) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <StyledText variant="label" color={errorColor}>
          Shipment not found.
        </StyledText>
      </SafeAreaView>
    );
  }

  const readyToComplete = canCompleteReceiving(shipment);
  const receivingClosed = isReceivingClosed(shipment.status);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadShipment(shipment.id)}
            tintColor={successColor}
          />
        }
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBar, { borderBottomColor: borderColor }]}
        >
          <StyledText variant="label" color={iconMuted}>
            ← INBOUND QUEUE
          </StyledText>
        </Pressable>

        <ShipmentHeader shipment={shipment} />

        {receivingClosed ? (
          <View
            style={[
              styles.completionBanner,
              flatPanel,
              { backgroundColor: cardColor, borderColor: successColor },
            ]}
          >
            <View style={[styles.completionBand, { backgroundColor: successColor }]}>
              <StyledText variant="eyebrow" style={styles.completionBandText}>
                {formatReceivingClosedStatus(shipment.status).toUpperCase()}
              </StyledText>
            </View>
            <View style={styles.completionBody}>
              <StyledText variant="body" color={iconMuted}>
                Receiving is closed for this shipment.
              </StyledText>
              <StyledButton
                title="Back to inbound queue"
                onPress={() => router.replace("/main/sorter" as Href)}
                variant="large"
                buttonStyles={[flatButton, styles.actionButton]}
              />
            </View>
          </View>
        ) : (
          <ShipmentReceivingProgress shipment={shipment} />
        )}

        <ManifestLineList
          lines={shipment.manifest_lines}
          receiptLines={shipment.receipt_lines}
          onReceive={
            shipment.status === "receiving"
              ? (line) => {
                  setSheetError(null);
                  setReceiveTarget(line);
                }
              : undefined
          }
        />

        <ReceiptLineList lines={shipment.receipt_lines} onPressLine={goToLine} />

        {error ? (
          <StyledText variant="label" color={errorColor} style={styles.error}>
            {error}
          </StyledText>
        ) : null}

        {isArrivableShipmentStatus(shipment.status) ? (
          <StyledButton
            title={
              shipment.status === "arrived"
                ? "Mark arrived · start receiving"
                : "Start receiving"
            }
            onPress={markArrived}
            variant="large"
            loading={isLoading}
            buttonStyles={[flatButton, styles.actionButton, { backgroundColor: textColor }]}
          />
        ) : null}

        {shipment.status === "receiving" && readyToComplete ? (
          <StyledButton
            title="Complete receiving"
            onPress={completeShipment}
            variant="large"
            loading={isLoading}
            buttonStyles={[flatButton, styles.actionButton]}
          />
        ) : null}
      </ScrollView>

      <ReceiveLineSheet
        visible={receiveTarget !== null}
        manifestLine={receiveTarget}
        onClose={() => {
          setReceiveTarget(null);
          setSheetError(null);
        }}
        submitting={sheetSubmitting}
        submitError={sheetError}
        onSubmit={async (values) => {
          if (!receiveTarget) return;
          const resolvedShipmentId =
            typeof shipmentId === "string" ? shipmentId : shipment.id;

          setSheetSubmitting(true);
          setSheetError(null);
          try {
            const created = await receiveLine({
              shipmentId: resolvedShipmentId,
              manifestLineId: receiveTarget.id,
              productId: receiveTarget.product_id!,
              receivedQuantity: values.receivedQuantity,
              damagedQuantity: values.damagedQuantity,
              packagingMode: values.packagingMode,
              cartonCount: values.cartonCount,
              unitsPerCarton: values.unitsPerCarton,
            });
            setReceiveTarget(null);
            router.push(
              `/main/sorter/line/${created.id}?shipmentId=${resolvedShipmentId}` as Href,
            );
          } catch (err) {
            setSheetError(
              err instanceof Error ? err.message : "Unable to receive line.",
            );
          } finally {
            setSheetSubmitting(false);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBar: {
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: SORTER_BORDER,
  },
  error: {
    marginTop: 8,
  },
  completionBanner: {
    overflow: "hidden",
    marginBottom: 4,
  },
  completionBand: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  completionBandText: {
    color: "#000000",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  completionBody: {
    padding: 14,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    marginTop: 4,
  },
});
