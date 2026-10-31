import { type Href, router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ShipmentCard from "@/app/components/sorter/ShipmentCard";
import {
  SorterChromeFooter,
  SorterChromeHeader,
  SorterHubHeader,
  SorterSectionBand,
  SorterStatGrid,
} from "@/app/components/sorter/ui/SorterLayout";
import { flatPanel, SORTER_ACCENT_WIDTH, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import StyledText from "@/app/components/StyledText";
import { formatDockLabel } from "@/constants/sorter";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSorter } from "@/hooks/useSorter";
import type { ReceiptLineSummary } from "@/interfaces/sorter";

function stageLabel(stage: ReceiptLineSummary["stage"]) {
  switch (stage) {
    case "awaiting_tag":
      return "TAG";
    case "awaiting_verify":
      return "VERIFY";
    case "awaiting_putaway":
      return "PUTAWAY";
    default:
      return stage.toUpperCase();
  }
}

function QuickLineRow({
  line,
  stage,
  onPress,
}: {
  line: ReceiptLineSummary;
  stage: ReceiptLineSummary["stage"];
  onPress: () => void;
}) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const warningColor = useThemeColor({}, "warning");
  const buttonColor = useThemeColor({}, "button");

  const stageColor =
    stage === "awaiting_tag"
      ? warningColor
      : stage === "awaiting_verify"
        ? buttonColor
        : buttonColor;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickRow, { backgroundColor: cardColor }]}
    >
      <View style={[styles.quickStripe, { backgroundColor: stageColor }]} />
      <View style={styles.quickContent}>
        <StyledText variant="bodyMedium">{line.product_name}</StyledText>
        <StyledText variant="monoSmall" color={iconMuted}>
          {line.shipment_id} · {line.accepted_quantity} units
        </StyledText>
      </View>
      <View style={[styles.quickStage, { borderLeftColor: borderColor }]}>
        <StyledText variant="caption" color={stageColor} style={styles.quickStageText}>
          {stageLabel(stage)}
        </StyledText>
      </View>
    </Pressable>
  );
}

function TaskSection({
  title,
  lines,
  stage,
  onLinePress,
}: {
  title: string;
  lines: ReceiptLineSummary[];
  stage: ReceiptLineSummary["stage"];
  onLinePress: (line: ReceiptLineSummary) => void;
}) {
  const borderColor = useThemeColor({}, "borders");

  if (lines.length === 0) return null;

  return (
    <View style={styles.taskSection}>
      <SorterSectionBand title={title} />
      <View style={[styles.taskList, flatPanel, { borderColor }]}>
        {lines.map((line, index) => (
          <View
            key={line.id}
            style={
              index > 0
                ? { borderTopWidth: SORTER_BORDER, borderTopColor: borderColor }
                : undefined
            }
          >
            <QuickLineRow
              line={line}
              stage={stage}
              onPress={() => onLinePress(line)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SorterHubScreen() {
  const bgColor = useThemeColor({}, "background");
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  const {
    employee,
    shipments,
    awaitingTag,
    awaitingVerify,
    awaitingPutaway,
    stats,
    isLoading,
    error,
    refreshHub,
  } = useSorter();

  const employeeName = employee?.full_name ?? employee?.employee_id ?? "Sorter";

  const goToShipment = (shipmentId: string) => {
    router.push(`/main/sorter/${shipmentId}` as Href);
  };

  const goToLine = (line: ReceiptLineSummary, step?: "verify" | "putaway") => {
    const href = step
      ? (`/main/sorter/line/${line.id}?shipmentId=${line.shipment_id}&step=${step}` as Href)
      : (`/main/sorter/line/${line.id}?shipmentId=${line.shipment_id}` as Href);
    router.push(href);
  };

  const hubIsEmpty =
    !isLoading &&
    shipments.length === 0 &&
    awaitingTag.length === 0 &&
    awaitingVerify.length === 0 &&
    awaitingPutaway.length === 0;

  const openTaskCount =
    stats && stats.awaitingVerify > 0 ? stats.awaitingVerify : (stats?.awaitingPutaway ?? 0);
  const openTaskLabel =
    stats && stats.awaitingVerify > 0 ? "Awaiting verify" : "Awaiting putaway";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshHub}
            tintColor={successColor}
          />
        }
      >
        <SorterChromeHeader />

        <SorterHubHeader
          employeeName={employeeName}
          dockLabel={formatDockLabel(employee?.warehouse_code)}
        />

        {stats ? (
          <SorterStatGrid
            items={[
              { value: stats.taggedToday, label: "Tagged today", tone: "success" },
              { value: openTaskCount, label: openTaskLabel, tone: "warning" },
              { value: `${stats.accuracy}%`, label: "Verify rate", tone: "primary" },
            ]}
          />
        ) : null}

        {isLoading && !stats ? (
          <ActivityIndicator color={successColor} style={styles.loader} />
        ) : null}

        {error ? (
          <StyledText variant="label" color={errorColor}>
            {error}
          </StyledText>
        ) : null}

        <SorterSectionBand title="INCOMING SHIPMENTS" />

        {hubIsEmpty ? (
          <View style={[styles.emptyState, flatPanel, { borderColor, backgroundColor: cardColor }]}>
            <StyledText variant="body" color={iconMuted}>
              No inbound work in queue. Pull to refresh when a shipment is scheduled or arrives at
              dock.
            </StyledText>
          </View>
        ) : (
          <View style={[styles.shipmentList, flatPanel, { borderColor }]}>
            {shipments.map((shipment, index) => (
              <View
                key={shipment.id}
                style={
                  index > 0
                    ? { borderTopWidth: SORTER_BORDER, borderTopColor: borderColor }
                    : undefined
                }
              >
                <ShipmentCard
                  shipment={shipment}
                  onPress={() => goToShipment(shipment.id)}
                />
              </View>
            ))}
          </View>
        )}

        <TaskSection
          title="AWAITING TAG"
          lines={awaitingTag}
          stage="awaiting_tag"
          onLinePress={(line) => goToLine(line)}
        />
        <TaskSection
          title="AWAITING VERIFY"
          lines={awaitingVerify}
          stage="awaiting_verify"
          onLinePress={(line) => goToLine(line, "verify")}
        />
        <TaskSection
          title="AWAITING PUTAWAY"
          lines={awaitingPutaway}
          stage="awaiting_putaway"
          onLinePress={(line) => goToLine(line, "putaway")}
        />

        <SorterChromeFooter />
      </ScrollView>
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
  loader: {
    marginTop: 24,
  },
  emptyState: {
    padding: 16,
  },
  shipmentList: {
    overflow: "hidden",
  },
  taskSection: {
    gap: 0,
  },
  taskList: {
    overflow: "hidden",
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  quickStripe: {
    width: SORTER_ACCENT_WIDTH,
  },
  quickContent: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  quickStage: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: SORTER_BORDER,
    paddingHorizontal: 6,
  },
  quickStageText: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
