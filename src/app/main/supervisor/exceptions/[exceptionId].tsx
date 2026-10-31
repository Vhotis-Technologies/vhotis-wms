import { type Href, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ExceptionContextCard from "@/app/components/supervisor/ExceptionContextCard";
import ExceptionPhotoGallery from "@/app/components/supervisor/ExceptionPhotoGallery";
import ExceptionResolutionPanel from "@/app/components/supervisor/ExceptionResolutionPanel";
import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisorException } from "@/hooks/useSupervisorException";
import { useAuthStore } from "@/store";

function parseExceptionId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function SupervisorExceptionDetailScreen() {
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

  const {
    exception,
    isLoading,
    isResolving,
    error,
    resolveError,
    successMessage,
    canApprove,
    resolveException,
  } = useSupervisorException(exceptionId);

  const warehouseId = useAuthStore((state) => state.employee?.warehouse ?? 0);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    Alert.alert("Exception resolved", successMessage, [
      {
        text: "Back to inbox",
        onPress: () => router.replace("/main/supervisor/exceptions" as Href),
      },
    ]);
  }, [successMessage]);

  const handleResolve = async (params: {
    resolution: Parameters<typeof resolveException>[0]["resolution"];
    notes: string;
    newLocationId?: number;
  }) => {
    const result = await resolveException(params);
    return Boolean(result);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            ← Exception inbox
          </StyledText>
        </Pressable>

        <StyledText variant="display">
          Exception {exceptionId ?? "—"}
        </StyledText>

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

        {exception ? (
          <>
            <ExceptionContextCard exception={exception} />
            <ExceptionPhotoGallery photoUrls={exception.photoUrls} />
            <ExceptionResolutionPanel
              exception={exception}
              warehouseId={warehouseId}
              canApprove={canApprove}
              isResolving={isResolving}
              error={resolveError}
              onResolve={handleResolve}
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
              Exception not found or no longer pending review.
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
});
