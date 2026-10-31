import { type Href, router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BoxSpecificationGrid from "@/app/components/packer/BoxSpecificationGrid";
import LabelPreviewCard from "@/app/components/packer/LabelPreviewCard";
import PackDispatchBanner from "@/app/components/packer/PackDispatchBanner";
import PackActiveLineCard from "@/app/components/packer/PackActiveLineCard";
import PackItemList from "@/app/components/packer/PackItemList";
import PackJobHeader from "@/app/components/packer/PackJobHeader";
import PackJobProgressCard from "@/app/components/packer/PackJobProgressCard";
import PackProgressRing from "@/app/components/packer/PackProgressRing";
import FloorScanPanel from "@/app/components/shared/FloorScanPanel";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { flatButton, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import { usePacker } from "@/hooks/usePacker";
import type { PackUiStep } from "@/interfaces/packer";

function parseInitialStep(raw: string | string[] | undefined): PackUiStep | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "verify" || value === "labelReady" || value === "dispatch") {
    return value;
  }
  return undefined;
}

export default function ActivePackScreen() {
  const bgColor = useThemeColor({}, "background");
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  const { jobId, step } = useLocalSearchParams<{ jobId: string; step?: string }>();
  const resolvedJobId = typeof jobId === "string" ? jobId : undefined;
  const initialStep = parseInitialStep(step);

  const {
    job,
    activeLine,
    uiStep,
    scanPayload,
    setScanPayload,
    scanSuccessMessage,
    isLoading,
    error,
    refreshJobDetail,
    handleOverviewAction,
    submitUnitScan,
    printLabel,
    continueToLabelScan,
    submitLabelScan,
    sendToDispatch,
    reprintLabel,
    resetToOverview,
    packButtonTitle,
    scanPrompt,
    scanDetail,
    scanButtonTitle,
    labelScanPrompt,
    labelScanDetail,
    verifiedCount,
    totalUnits,
    packComplete,
  } = usePacker({ jobId: resolvedJobId, initialStep });

  const handleBack = () => {
    if (uiStep === "verify" || uiStep === "labelScan" || uiStep === "labelReady") {
      resetToOverview();
      return;
    }
    router.back();
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
            {error ?? "Pack job not found."}
          </StyledText>
        </View>
      </SafeAreaView>
    );
  }

  if (uiStep === "dispatch") {
    const handleBackToQueue = () => {
      router.replace("/main/packer" as Href);
    };

    const handleSendDispatch = async () => {
      const result = await sendToDispatch();
      if (result) {
        router.replace("/main/packer" as Href);
      }
    };

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            resolvedJobId ? (
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => refreshJobDetail(resolvedJobId)}
                tintColor={successColor}
              />
            ) : undefined
          }
        >
          <Pressable onPress={handleBackToQueue}>
            <StyledText variant="label" color={iconMuted} style={styles.backLink}>
              ← Back to pack queue
            </StyledText>
          </Pressable>

          <PackJobHeader
            orderId={job.order_id}
            storeName={job.store_name}
            itemCount={job.item_count}
            boxHint={job.box_hint}
            stationLabel={job.station_label}
          />

          <LabelPreviewCard label={job.label} orderId={job.order_id} />

          <PackDispatchBanner
            job={job}
            notice={scanSuccessMessage}
            onSendDispatch={handleSendDispatch}
            onBackToQueue={handleBackToQueue}
            loading={isLoading}
          />

          <StyledButton
            title="🖨 Reprint label"
            onPress={reprintLabel}
            variant="tonal"
            loading={isLoading}
            buttonStyles={[flatButton, styles.printButton]}
          />

          {error ? (
            <StyledText variant="label" color={errorColor} style={styles.error}>
              {error}
            </StyledText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          resolvedJobId ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refreshJobDetail(resolvedJobId)}
              tintColor={successColor}
            />
          ) : undefined
        }
      >
        <Pressable onPress={handleBack}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            {uiStep === "verify" || uiStep === "labelScan" || uiStep === "labelReady"
              ? "← Back to pack overview"
              : "← Back to jobs"}
          </StyledText>
        </Pressable>

        <PackJobHeader
          orderId={job.order_id}
          storeName={job.store_name}
          itemCount={job.item_count}
          boxHint={job.box_hint}
          stationLabel={job.station_label}
        />

        {uiStep === "overview" ? <PackJobProgressCard job={job} /> : null}

        {uiStep !== "labelScan" ? (
          <PackProgressRing
            current={verifiedCount}
            total={totalUnits}
            label="Units verified"
          />
        ) : null}

        {uiStep === "verify" && activeLine ? (
          <PackActiveLineCard line={activeLine} />
        ) : null}

        {uiStep === "overview" || uiStep === "verify" ? (
          <PackItemList lines={job.pack_lines} />
        ) : null}

        {(uiStep === "overview" && packComplete) ||
        uiStep === "labelReady" ? (
          <BoxSpecificationGrid boxSpec={job.box_spec} />
        ) : null}

        {uiStep === "verify" ? (
          <FloorScanPanel
            prompt={scanPrompt}
            detail={scanDetail}
            viewportPrompt="Scan unit barcode"
            value={scanPayload}
            onChangeText={setScanPayload}
            onSubmit={submitUnitScan}
            isLoading={isLoading}
            enabled={uiStep === "verify"}
            confirmTitle={`✓ ${scanButtonTitle}`}
            successMessage={scanSuccessMessage}
            successColor={successColor}
          />
        ) : null}

        {uiStep === "labelReady" ? (
          <>
            <LabelPreviewCard label={job.label} orderId={job.order_id} />
            {scanSuccessMessage ? (
              <StyledText variant="label" color={successColor} style={styles.success}>
                {scanSuccessMessage}
              </StyledText>
            ) : null}
            <StyledButton
              title={job.label_printed ? "Continue to label scan" : "🖨 Print label"}
              onPress={() => {
                if (job.label_printed) {
                  continueToLabelScan();
                  return;
                }
                void printLabel();
              }}
              variant="tonal"
              loading={isLoading}
              buttonStyles={[flatButton, styles.printButton]}
            />
          </>
        ) : null}

        {uiStep === "labelScan" ? (
          <>
            <LabelPreviewCard
              label={job.label}
              orderId={job.order_id}
              showBarcode={false}
            />
            <FloorScanPanel
              prompt={labelScanPrompt}
              detail={labelScanDetail}
              viewportPrompt="Scan shipping label barcode"
              value={scanPayload}
              onChangeText={setScanPayload}
              onSubmit={submitLabelScan}
              isLoading={isLoading}
              enabled={uiStep === "labelScan"}
              confirmTitle="✓ Confirm label scan"
              successMessage={scanSuccessMessage}
              successColor={successColor}
            />
          </>
        ) : null}

        {error ? (
          <StyledText variant="label" color={errorColor} style={styles.error}>
            {error}
          </StyledText>
        ) : null}

        {uiStep === "overview" ? (
          <StyledButton
            title={packButtonTitle}
            onPress={handleOverviewAction}
            variant="large"
            loading={isLoading}
            buttonStyles={[flatButton, styles.primaryButton]}
          />
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
  backLink: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: FLOOR_BORDER,
  },
  error: {
    marginTop: 8,
  },
  success: {
    marginTop: 4,
  },
  primaryButton: {
    paddingVertical: 16,
    marginTop: 4,
  },
  printButton: {
    paddingVertical: 16,
    borderWidth: FLOOR_BORDER,
    marginTop: 4,
  },
});
