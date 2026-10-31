import { type Href, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TagLabelsPanel from "@/app/components/sorter/TagLabelsPanel";
import SorterScanStage from "@/app/components/sorter/ui/SorterScanStage";
import {
  SorterItemPanel,
  SorterLineProgress,
  SorterLocationPanel,
  SorterQuantityStrip,
} from "@/app/components/sorter/ui/SorterLayout";
import { flatButton, flatPanel, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { useAuthStore } from "@/store";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSorter } from "@/hooks/useSorter";
import type { SortUiStep } from "@/interfaces/sorter";
import {
  containerScanDetail,
  containerScanPrompt,
  hasSuggestedBin,
  putawayGuidanceDetail,
  putawayGuidanceHeadline,
  putawayGuidanceSectionLabel,
  putawayScanDetail,
  putawayScanPrompt,
  putawayStockBeingStoredLabel,
  putawayViewportPrompt,
  zoneStorageLabel,
} from "@/utils/sorterPutaway";

function parseLineId(raw: string | string[] | undefined): number | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? undefined : id;
}

function parseInitialStep(raw: string | string[] | undefined): SortUiStep | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "verify" || value === "putaway" || value === "tag") {
    return value;
  }
  return undefined;
}

const STEP_LABELS: Record<SortUiStep, string> = {
  overview: "OVERVIEW",
  tag: "TAG",
  verify: "VERIFY",
  container: "CARTON",
  putaway: "PUTAWAY",
  confirmed: "DONE",
};

function StepRail({ currentStep }: { currentStep: SortUiStep }) {
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const successColor = useThemeColor({}, "success");
  const iconMuted = useThemeColor({}, "icons");
  const textColor = useThemeColor({}, "text");

  const steps: SortUiStep[] = ["overview", "tag", "verify", "putaway"];

  const currentIndex = steps.indexOf(
    currentStep === "container" ? "putaway" : currentStep === "confirmed" ? "putaway" : currentStep,
  );

  return (
    <View style={[styles.stepRail, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      {steps.map((step, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;
        const fillColor = done ? successColor : active ? textColor : borderColor;

        return (
          <View
            key={step}
            style={[
              styles.stepCell,
              index > 0 ? { borderLeftWidth: SORTER_BORDER, borderLeftColor: borderColor } : null,
            ]}
          >
            <View style={[styles.stepIndicator, { backgroundColor: fillColor }]} />
            <StyledText
              variant="micro"
              color={active ? textColor : done ? successColor : iconMuted}
              style={styles.stepLabel}
            >
              {STEP_LABELS[step]}
            </StyledText>
          </View>
        );
      })}
    </View>
  );
}

export default function ActiveReceiptLineScreen() {
  const bgColor = useThemeColor({}, "background");
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const textColor = useThemeColor({}, "text");
  const bandForeground = useThemeColor({}, "background");

  const { lineId: lineIdParam, shipmentId, step } = useLocalSearchParams<{
    lineId: string;
    shipmentId?: string;
    step?: string;
  }>();

  const lineId = parseLineId(lineIdParam);
  const initialStep = parseInitialStep(step);
  const warehouseCode = useAuthStore((state) => state.employee?.warehouse_code);

  const {
    line,
    uiStep,
    scanPayload,
    setScanPayload,
    isLoading,
    error,
    generateLabels,
    viewTagLabels,
    advanceAfterTag,
    beginVerify,
    beginPutaway,
    submitUnitVerify,
    submitContainerScan,
    submitPutaway,
    resetToOverview,
    verifiedCount,
    totalUnits,
    storedCount,
    putawayTarget,
    remainingPutaway,
    lastPutawayLocation,
    activeContainerCode,
    tagResult,
  } = useSorter({
    lineId,
    shipmentId: typeof shipmentId === "string" ? shipmentId : undefined,
    initialStep,
  });

  useEffect(() => {
    if (!line) return;
    if (initialStep === "verify") {
      beginVerify();
    } else if (initialStep === "putaway") {
      beginPutaway();
    } else if (initialStep === "tag") {
      viewTagLabels();
    }
  }, [line, initialStep, beginVerify, beginPutaway, viewTagLabels]);

  const handleBack = () => {
    if (uiStep !== "overview") {
      resetToOverview();
      return;
    }
    router.back();
  };

  const goToShipment = () => {
    if (line?.shipment_id) {
      router.replace(`/main/sorter/${line.shipment_id}` as Href);
    } else {
      router.replace("/main/sorter" as Href);
    }
  };

  if (!line) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={successColor} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (uiStep === "confirmed") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={[styles.completePanel, flatPanel, { borderColor, backgroundColor: cardColor }]}>
            <View style={[styles.completeBand, { backgroundColor: successColor }]}>
              <StyledText variant="eyebrow" style={styles.completeBandText}>
                LINE COMPLETE
              </StyledText>
            </View>
            <View style={styles.completeBody}>
              <StyledText variant="display">Stored</StyledText>
              <StyledText variant="body" color={iconMuted}>
                {line.product_name} — all {line.accepted_quantity} units put away
                {lastPutawayLocation ? ` at ${lastPutawayLocation}` : ""}.
              </StyledText>
              <StyledText variant="caption" color={iconMuted}>
                When every receipt line on this shipment is stored, return to the shipment to
                complete receiving.
              </StyledText>
            </View>
          </View>
          <StyledButton
            title="Back to shipment"
            onPress={goToShipment}
            variant="large"
            buttonStyles={[flatButton, styles.primaryButton]}
          />
          <StyledButton
            title="Back to inbound queue"
            onPress={() => router.replace("/main/sorter" as Href)}
            variant="large"
            buttonStyles={[
              flatButton,
              styles.secondaryButton,
              { borderColor, backgroundColor: cardColor, borderWidth: SORTER_BORDER },
            ]}
            textStyles={{ color: textColor }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const progressCurrent =
    uiStep === "tag"
      ? totalUnits
      : uiStep === "putaway" || uiStep === "container"
        ? storedCount
        : verifiedCount;
  const progressLabel =
    uiStep === "tag"
      ? "Labels generated"
      : uiStep === "putaway" || uiStep === "container"
        ? "Units stored"
        : "Units verified";

  const resolvedTagResult =
    tagResult ??
    (line.tagged
      ? {
          line,
          unit_codes: line.stock_units.map((unit) => unit.unit_code),
          container_codes: line.storage_containers.map(
            (container) => container.container_code,
          ),
        }
      : null);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={handleBack}
          style={[styles.backBar, { borderBottomColor: borderColor }]}
        >
          <StyledText variant="label" color={iconMuted}>
            {uiStep === "overview" ? "← SHIPMENT" : "← LINE OVERVIEW"}
          </StyledText>
        </Pressable>

        <StepRail currentStep={uiStep} />

        <SorterLineProgress
          current={progressCurrent}
          total={totalUnits}
          label={progressLabel}
          shipmentId={line.shipment_id}
          productName={line.product_name}
        />

        <SorterItemPanel
          productName={line.product_name}
          sku={line.seller_sku}
          sectionLabel="SORT THIS ITEM"
        />

        <SorterQuantityStrip required={line.accepted_quantity} stored={storedCount} />

        {uiStep === "overview" ? (
          <>
            {line.tagged ? (
              <View
                style={[styles.codesPanel, flatPanel, { backgroundColor: cardColor, borderColor }]}
              >
                <View style={[styles.codesBand, { backgroundColor: textColor }]}>
                  <StyledText variant="eyebrow" style={[styles.codesBandText, { color: bandForeground }]}>
                    GENERATED CODES
                  </StyledText>
                </View>
                <View style={styles.codesBody}>
                  <StyledText variant="monoSmall" color={iconMuted}>
                    {line.stock_units.map((u) => u.unit_code).join(" · ")}
                  </StyledText>
                  {line.storage_containers.length > 0 ? (
                    <StyledText variant="monoSmall" color={iconMuted}>
                      {line.storage_containers.map((c) => c.container_code).join(" · ")}
                    </StyledText>
                  ) : null}
                </View>
              </View>
            ) : null}

            {line.stage === "awaiting_tag" ? (
              <StyledButton
                title="Generate labels"
                onPress={generateLabels}
                variant="large"
                loading={isLoading}
                buttonStyles={[flatButton, styles.primaryButton]}
              />
            ) : null}

            {line.tagged ? (
              <StyledButton
                title="View generated labels"
                onPress={generateLabels}
                variant="large"
                buttonStyles={[
                  flatButton,
                  styles.secondaryButton,
                  { borderColor, backgroundColor: cardColor, borderWidth: SORTER_BORDER },
                ]}
                textStyles={{ color: textColor }}
              />
            ) : null}

            {line.stage === "awaiting_verify" ? (
              <StyledButton
                title="Start verification"
                onPress={beginVerify}
                variant="large"
                buttonStyles={[flatButton, styles.primaryButton]}
              />
            ) : null}

            {line.stage === "awaiting_putaway" ? (
              <StyledButton
                title="Continue putaway"
                onPress={beginPutaway}
                variant="large"
                buttonStyles={[flatButton, styles.primaryButton]}
              />
            ) : null}
          </>
        ) : null}

        {uiStep === "tag" && resolvedTagResult ? (
          <>
            <TagLabelsPanel
              line={resolvedTagResult.line}
              unitCodes={resolvedTagResult.unit_codes}
              containerCodes={resolvedTagResult.container_codes}
            />
            <StyledButton
              title="Start verification"
              onPress={advanceAfterTag}
              variant="large"
              buttonStyles={[flatButton, styles.primaryButton]}
            />
          </>
        ) : null}

        {uiStep === "verify" ? (
          <>
            {line.stock_units.some((unit) => !unit.verified) ? (
              <View style={[styles.hintBar, flatPanel, { borderColor, backgroundColor: cardColor }]}>
                <StyledText variant="eyebrow" color={iconMuted}>
                  NEXT UNIT
                </StyledText>
                <StyledText variant="monoSmall" color={successColor}>
                  {line.stock_units.find((unit) => !unit.verified)?.unit_code ??
                    "Scan any unit label"}
                </StyledText>
              </View>
            ) : null}
            <SorterScanStage
              prompt={`Scan each unit label (${verifiedCount} of ${totalUnits} verified)`}
              detail="Match the physical sticker to the barcode on screen"
              scanStep="unit"
              viewportPrompt="Scan unit barcode"
              value={scanPayload}
              onChangeText={setScanPayload}
              onSubmit={submitUnitVerify}
              isLoading={isLoading}
              enabled={uiStep === "verify"}
              confirmTitle="Confirm unit scan"
              inputPlaceholder="Scan or enter UNIT… code"
            />
          </>
        ) : null}

        {uiStep === "container" ? (
          <SorterScanStage
            prompt={containerScanPrompt(putawayTarget)}
            detail={containerScanDetail(remainingPutaway)}
            scanStep="container"
            viewportPrompt="Scan carton barcode"
            value={scanPayload}
            onChangeText={setScanPayload}
            onSubmit={submitContainerScan}
            isLoading={isLoading}
            enabled={uiStep === "container"}
            confirmTitle="Confirm carton scan"
            inputPlaceholder="Scan or enter BOX… code"
          />
        ) : null}

        {uiStep === "putaway" ? (
          <>
            <SorterLocationPanel
              locationCode={putawayGuidanceHeadline(line)}
              locationDetail={putawayGuidanceDetail(
                line,
                putawayTarget,
                activeContainerCode,
              )}
              sectionLabel={putawayGuidanceSectionLabel(line)}
            />
            {putawayStockBeingStoredLabel(putawayTarget, activeContainerCode) ? (
              <View
                style={[styles.stockChip, flatPanel, { backgroundColor: cardColor, borderColor }]}
              >
                <StyledText variant="label" color={iconMuted}>
                  {putawayStockBeingStoredLabel(putawayTarget, activeContainerCode)}
                </StyledText>
              </View>
            ) : null}
            {!hasSuggestedBin(line) ? (
              <StyledText variant="caption" color={iconMuted} style={styles.putawayHint}>
                No bin is pre-assigned. Walk to the {line.zone} area, choose an empty shelf, then
                scan that bin&apos;s label below.
              </StyledText>
            ) : null}
            <StyledText variant="caption" color={iconMuted}>
              {zoneStorageLabel(line.zone)} · {storedCount} stored · {remainingPutaway} remaining
              {lastPutawayLocation ? ` · last bin ${lastPutawayLocation}` : ""}
            </StyledText>
            <SorterScanStage
              prompt={putawayScanPrompt(putawayTarget, activeContainerCode)}
              detail={putawayScanDetail(line, warehouseCode)}
              viewportPrompt={putawayViewportPrompt()}
              scanStep="location"
              value={scanPayload}
              onChangeText={setScanPayload}
              onSubmit={submitPutaway}
              isLoading={isLoading}
              enabled={uiStep === "putaway" && Boolean(putawayTarget)}
              confirmTitle="Confirm putaway"
              confirmDisabled={!putawayTarget}
              inputPlaceholder={`Bin label, e.g. ${warehouseCode ?? "WH"}:A-01-02`}
            />
          </>
        ) : null}

        {error ? (
          <StyledText variant="label" color={errorColor} style={styles.error}>
            {error}
          </StyledText>
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
  stepRail: {
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 4,
  },
  stepCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 6,
  },
  stepIndicator: {
    width: "80%",
    height: 4,
  },
  stepLabel: {
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  completePanel: {
    overflow: "hidden",
    marginBottom: 8,
  },
  completeBand: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  completeBandText: {
    color: "#000000",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  completeBody: {
    padding: 14,
    gap: 10,
  },
  error: {
    marginTop: 8,
  },
  stockChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  putawayHint: {
    lineHeight: 18,
  },
  primaryButton: {
    paddingVertical: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
  },
  codesPanel: {
    overflow: "hidden",
  },
  codesBand: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  codesBandText: {
    letterSpacing: 1.2,
  },
  codesBody: {
    padding: 14,
    gap: 8,
  },
  hintBar: {
    padding: 12,
    gap: 4,
  },
});
