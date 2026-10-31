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

import ItemDetailCard from "@/app/components/picker/ItemDetailCard";
import LocationGuidanceCard from "@/app/components/picker/LocationGuidanceCard";
import PickHandoffBanner from "@/app/components/picker/PickHandoffBanner";
import PickConfirmedPanel from "@/app/components/picker/PickConfirmedPanel";
import PickJobHeader from "@/app/components/picker/PickJobHeader";
import PickJobProgressCard from "@/app/components/picker/PickJobProgress";
import PickLineList from "@/app/components/picker/PickLineList";
import PickProgressBar from "@/app/components/picker/PickProgressBar";
import QuantityTiles from "@/app/components/picker/QuantityTiles";
import FloorScanPanel from "@/app/components/shared/FloorScanPanel";
import ShortPickSheet from "@/app/components/picker/ShortPickSheet";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { flatButton, flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import { usePicker } from "@/hooks/usePicker";
import type { PickUiStep } from "@/interfaces/picker";
import { allOpenLinesBlocked, countRemainingPickLines } from "@/utils/pickerJob";
import {
  getScanDetailForStep,
  getScanPromptForStep,
} from "@/utils/pickerScan";

function parseInitialStep(raw: string | string[] | undefined): PickUiStep | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "scan" ? "scan" : undefined;
}

export default function ActivePickScreen() {
  const bgColor = useThemeColor({}, "background");
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");

  const { jobId, step } = useLocalSearchParams<{ jobId: string; step?: string }>();
  const resolvedJobId = typeof jobId === "string" ? jobId : undefined;
  const initialStep = parseInitialStep(step);
  const [showShortPick, setShowShortPick] = useState(false);

  const {
    job,
    activeLine,
    jobComplete,
    jobReadyForPack,
    uiStep,
    scanStep,
    scanPayload,
    setScanPayload,
    lastPickedUnitCode,
    confirmedLine,
    scanSuccessMessage,
    exceptionNotice,
    isLoading,
    error,
    loadJob,
    beginScan,
    submitScan,
    confirmNextItem,
    raiseShortPick,
    resetToOverview,
    scanButtonTitle,
    progressLabel,
    progressDoneLabel,
    currentItemIndex,
    totalItems,
    unitProgressCurrent,
    unitProgressTotal,
  } = usePicker({ jobId: resolvedJobId, initialStep });

  const handleBack = () => {
    if (uiStep === "scan") {
      resetToOverview();
      return;
    }
    router.back();
  };

  const handleConfirmNext = async () => {
    const handoffReady = jobReadyForPack;

    await confirmNextItem();

    if (handoffReady) {
      router.replace("/main/picker" as Href);
    }
  };

  const handleBackToQueue = () => {
    router.replace("/main/picker" as Href);
  };

  if (isLoading && !job) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={successColor} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <View style={styles.container}>
          <Pressable onPress={() => router.back()}>
            <StyledText variant="label" color={iconMuted} style={styles.backLink}>
              ← Back to jobs
            </StyledText>
          </Pressable>
          <StyledText variant="label" color={errorColor}>
            {error ?? "Pick job not found."}
          </StyledText>
        </View>
      </SafeAreaView>
    );
  }

  if (uiStep === "confirmed" && confirmedLine) {
    const remaining = countRemainingPickLines(job);

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={() => router.back()}>
            <StyledText variant="label" color={iconMuted} style={styles.backLink}>
              ← Back to jobs
            </StyledText>
          </Pressable>
          <PickConfirmedPanel
            line={confirmedLine}
            unitCode={lastPickedUnitCode}
            progressDoneLabel={progressDoneLabel}
            remainingCount={remaining}
            handoffReady={remaining === 0}
            onNext={handleConfirmNext}
            loading={isLoading}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (jobReadyForPack) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            resolvedJobId ? (
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => loadJob(resolvedJobId)}
                tintColor={successColor}
              />
            ) : undefined
          }
        >
          <Pressable onPress={handleBackToQueue}>
            <StyledText variant="label" color={iconMuted} style={styles.backLink}>
              ← Back to pick queue
            </StyledText>
          </Pressable>
          <PickJobHeader job={job} />
          <PickHandoffBanner
            job={job}
            onBackToQueue={handleBackToQueue}
            onOpenPackStation={() => router.push("/main/packer" as Href)}
          />
          <PickLineList lines={job.pick_lines} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const allBlocked = allOpenLinesBlocked(job);
  const scanPrompt = activeLine
    ? getScanPromptForStep(activeLine, scanStep)
    : "Scan barcode";
  const scanDetail = activeLine
    ? getScanDetailForStep(activeLine, scanStep)
    : undefined;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          resolvedJobId ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => loadJob(resolvedJobId)}
              tintColor={successColor}
            />
          ) : undefined
        }
      >
        <Pressable onPress={handleBack}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            {uiStep === "scan" ? "← Back to item list" : "← Back to jobs"}
          </StyledText>
        </Pressable>

        <PickJobHeader job={job} />
        <PickJobProgressCard job={job} activeLine={activeLine} />

        {uiStep !== "scan" ? (
          <PickProgressBar
            current={currentItemIndex}
            total={totalItems}
            label={progressLabel}
            orderId={job.order_id}
            storeName={job.store_name}
          />
        ) : null}

        {uiStep === "scan" && activeLine ? (
          <>
            <PickProgressBar
              current={unitProgressCurrent + 1}
              total={unitProgressTotal}
              label={`Unit ${Math.min(unitProgressCurrent + 1, unitProgressTotal)} of ${unitProgressTotal} on this line`}
              orderId={job.order_id}
              storeName={activeLine.product_name}
            />
            <QuantityTiles
              required={activeLine.quantity_required}
              picked={activeLine.quantity_picked}
            />
          </>
        ) : null}

        <PickLineList lines={job.pick_lines} />

        {uiStep === "overview" &&
        activeLine &&
        !activeLine.has_pending_exception &&
        !jobComplete ? (
          <>
            <LocationGuidanceCard
              locationCode={activeLine.location_code}
              locationDetail={activeLine.location_detail}
            />
            <ItemDetailCard
              productName={activeLine.product_name}
              sku={activeLine.sku}
            />
            <QuantityTiles
              required={activeLine.quantity_required}
              picked={activeLine.quantity_picked}
            />
            <StyledButton
              title="⚠ Report a problem"
              onPress={() => setShowShortPick(true)}
              variant="tonal"
              buttonStyles={[
                styles.reportButton,
                { borderColor: warningColor },
              ]}
              textStyles={{ color: warningColor, fontWeight: "600" }}
            />
          </>
        ) : null}

        {activeLine?.has_pending_exception ? (
          <View
            style={[
              styles.blockedBanner,
              {
                backgroundColor: `${warningColor}14`,
                borderColor: warningColor,
              },
            ]}
          >
            <StyledText variant="bodyMedium" color={warningColor}>
              Line blocked
            </StyledText>
            <StyledText variant="label" color={iconMuted} style={styles.blockedText}>
              A floor exception is open on this line. Picking resumes after a supervisor
              resolves it in the ops console.
            </StyledText>
          </View>
        ) : null}

        {exceptionNotice ? (
          <View
            style={[
              styles.noticeBanner,
              {
                backgroundColor: `${successColor}14`,
                borderColor: successColor,
              },
            ]}
          >
            <StyledText variant="label" color={successColor}>
              {exceptionNotice}
            </StyledText>
          </View>
        ) : null}

        {!activeLine && allBlocked && !jobComplete ? (
          <View
            style={[
              styles.blockedBanner,
              { backgroundColor: cardColor, borderColor: borderColor },
            ]}
          >
            <StyledText variant="bodyMedium" color={warningColor}>
              Job paused
            </StyledText>
            <StyledText variant="label" color={iconMuted} style={styles.blockedText}>
              All remaining lines are awaiting supervisor review.
            </StyledText>
          </View>
        ) : null}

        {scanSuccessMessage && uiStep === "scan" ? (
          <StyledText variant="label" color={successColor} style={styles.success}>
            {scanSuccessMessage}
          </StyledText>
        ) : null}

        {error ? (
          <StyledText variant="label" color={errorColor} style={styles.error}>
            {error}
          </StyledText>
        ) : null}

        {uiStep === "overview" &&
        activeLine &&
        !activeLine.has_pending_exception &&
        !jobComplete ? (
          <StyledButton
            title={scanButtonTitle}
            onPress={beginScan}
            variant="large"
            loading={isLoading}
            buttonStyles={[flatButton, styles.primaryButton]}
          />
        ) : null}

        {uiStep === "scan" && activeLine && !activeLine.has_pending_exception ? (
          <FloorScanPanel
            prompt={scanPrompt}
            detail={scanDetail}
            scanStep={scanStep}
            locationCode={activeLine.location_code}
            containerCode={activeLine.expected_container_code}
            value={scanPayload}
            onChangeText={setScanPayload}
            onSubmit={submitScan}
            isLoading={isLoading}
            enabled={uiStep === "scan"}
            confirmTitle="✓ Confirm scan"
            footerActions={
              <StyledButton
                title="⚠ Report problem"
                onPress={() => setShowShortPick(true)}
                variant="tonal"
                buttonStyles={[
                  styles.shortPickButton,
                  { borderColor: warningColor },
                ]}
                textStyles={{ color: warningColor, fontWeight: "600" }}
              />
            }
          />
        ) : null}

        {uiStep === "scan" ? (
          <Pressable onPress={resetToOverview} style={styles.resetScan}>
            <StyledText variant="caption" color={iconMuted}>
              Back to item list
            </StyledText>
          </Pressable>
        ) : null}
      </ScrollView>

      <ShortPickSheet
        visible={showShortPick}
        line={activeLine}
        loading={isLoading}
        onClose={() => setShowShortPick(false)}
        onSubmit={async (payload) => {
          await raiseShortPick({
            exceptionType: payload.type,
            quantityFound: payload.quantityFound,
            notes: payload.notes,
            photos: payload.photos,
          });
          setShowShortPick(false);
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
  backLink: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: FLOOR_BORDER,
  },
  error: {
    marginBottom: 12,
  },
  success: {
    marginBottom: 12,
  },
  completeBanner: {
    borderWidth: FLOOR_BORDER,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  blockedBanner: {
    padding: 16,
    marginBottom: 16,
    borderWidth: FLOOR_BORDER,
  },
  blockedText: {
    marginTop: 4,
  },
  noticeBanner: {
    padding: 14,
    marginBottom: 16,
    borderWidth: FLOOR_BORDER,
  },
  reportButton: {
    borderWidth: FLOOR_BORDER,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    paddingVertical: 14,
  },
  confirmButton: {
    flex: 1,
  },
  shortPickButton: {
    flex: 1,
    borderWidth: FLOOR_BORDER,
  },
  resetScan: {
    alignItems: "center",
    marginTop: 12,
  },
});
