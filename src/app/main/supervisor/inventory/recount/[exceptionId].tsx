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

import RecountConfirmationPanel from "@/app/components/supervisor/RecountConfirmationPanel";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import StyledText from "@/app/components/StyledText";
import { supervisorExceptionDetailHref } from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorRecountTask } from "@/hooks/useSupervisorInventory";

function parseExceptionId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function SupervisorRecountTaskScreen() {
  const { exceptionId: rawExceptionId } = useLocalSearchParams<{
    exceptionId: string;
  }>();
  const exceptionId = parseExceptionId(rawExceptionId);

  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  const { hasPermission } = useSupervisor();
  const canOverride = hasPermission("override_stock_counts");

  const { task, isLoading, isSubmitting, error, loadTask, confirmCount } =
    useSupervisorRecountTask(exceptionId);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    Alert.alert("Recount confirmed", successMessage, [
      {
        text: "Back to tasks",
        onPress: () => router.replace("/main/supervisor/inventory" as Href),
      },
    ]);
  }, [successMessage]);

  const handleConfirm = async (params: { countedQty: number; notes: string }) => {
    const result = await confirmCount(params);
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

        <StyledText variant="display">Recount task</StyledText>

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

        {task ? (
          <>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <StyledText variant="monoSmall" color={successColor}>
                {task.fulfillmentRequestId}
              </StyledText>
              <StyledText variant="headline">{task.productName}</StyledText>
              {task.sku ? (
                <StyledText variant="monoSmall" color={iconMuted}>
                  {task.sku}
                </StyledText>
              ) : null}
              <StyledText variant="label" color={iconMuted}>
                {task.locationDetail}
              </StyledText>
              <View style={styles.metaRow}>
                <ZoneBadge zone={task.zone} />
                <StyledText variant="caption" color={iconMuted}>
                  Exception {task.exceptionId}
                </StyledText>
              </View>
              {task.resolutionNotes ? (
                <StyledText variant="caption" color={iconMuted} style={styles.notes}>
                  {task.resolutionNotes}
                </StyledText>
              ) : null}
            </View>

            <Pressable
              onPress={() =>
                router.push(supervisorExceptionDetailHref(task.exceptionId) as Href)
              }
              style={styles.linkRow}
            >
              <StyledText variant="label" color={buttonColor}>
                View source exception →
              </StyledText>
            </Pressable>

            <RecountConfirmationPanel
              task={task}
              canOverride={canOverride}
              isSubmitting={isSubmitting}
              error={error}
              onConfirm={handleConfirm}
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
              Recount task not found or already confirmed.
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
  notes: {
    lineHeight: 18,
  },
  linkRow: {
    alignSelf: "flex-start",
  },
});
