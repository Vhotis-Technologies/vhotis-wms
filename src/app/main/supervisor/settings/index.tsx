import { router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { formatManagementRole } from "@/constants/supervisor";
import { resolveExpoPushToken } from "@/hooks/useSupervisorPush";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorSettings } from "@/hooks/useSupervisorSettings";

export default function SupervisorSettingsScreen() {
  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  const { employee, profile, shiftLabel } = useSupervisor();
  const {
    notifyEnabled,
    deviceRegistered,
    isSubmitting,
    error,
    successMessage,
    updateNotifyPreference,
    registerDeviceToken,
    clearDeviceToken,
  } = useSupervisorSettings();

  const employeeName =
    employee?.full_name ?? employee?.employee_id ?? "Supervisor";

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timer = setTimeout(() => {
      // noop - message clears on next action via hook if needed
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleToggleNotify = async (enabled: boolean) => {
    if (!enabled) {
      await clearDeviceToken();
      return;
    }

    const token = await resolveExpoPushToken();
    if (token) {
      await registerDeviceToken(token);
      return;
    }

    await updateNotifyPreference(true);
  };

  const handleRegisterPush = async () => {
    const token = await resolveExpoPushToken();
    if (!token) {
      return;
    }
    await registerDeviceToken(token);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            ← Control tower
          </StyledText>
        </Pressable>

        <StyledText variant="display">Supervisor settings</StyledText>
        <StyledText variant="body" color={iconMuted}>
          {employeeName} · {shiftLabel}
        </StyledText>

        <View
          style={[styles.card, { backgroundColor: cardColor, borderColor }]}
        >
          <StyledText variant="headline">Today on shift</StyledText>
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <StyledText variant="caption" color={iconMuted}>
                Role
              </StyledText>
              <StyledText variant="bodyMedium">
                {formatManagementRole(profile?.management_role)}
              </StyledText>
            </View>
            <View style={styles.statCell}>
              <StyledText variant="caption" color={iconMuted}>
                Resolved today
              </StyledText>
              <StyledText variant="stat" color={successColor}>
                {profile?.exceptions_resolved_today ?? 0}
              </StyledText>
            </View>
            <View style={styles.statCell}>
              <StyledText variant="caption" color={iconMuted}>
                Avg resolution
              </StyledText>
              <StyledText variant="bodyMedium">
                {Math.round(profile?.avg_exception_resolution_minutes ?? 0)}m
              </StyledText>
            </View>
          </View>
        </View>

        <View
          style={[styles.card, { backgroundColor: cardColor, borderColor }]}
        >
          <StyledText variant="headline">Exception alerts</StyledText>
          <StyledText variant="body" color={iconMuted}>
            Push when pickers raise new floor exceptions. Requires device
            permissions on this handset.
          </StyledText>

          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <StyledText variant="bodyMedium">Notify me</StyledText>
              <StyledText variant="caption" color={iconMuted}>
                {deviceRegistered
                  ? "This device is registered for alerts."
                  : "No push token registered yet."}
              </StyledText>
            </View>
            <Switch
              value={notifyEnabled && deviceRegistered}
              onValueChange={(value) => {
                void handleToggleNotify(value);
              }}
              disabled={isSubmitting}
              trackColor={{ true: buttonColor, false: iconMuted }}
            />
          </View>

          {!deviceRegistered ? (
            <StyledButton
              title="Enable push on this device"
              variant="medium"
              disabled={isSubmitting}
              onPress={() => {
                void handleRegisterPush();
              }}
              buttonStyles={[
                styles.actionButton,
                { backgroundColor: buttonColor },
              ]}
            />
          ) : null}

          {isSubmitting ? (
            <ActivityIndicator size="small" color={buttonColor} />
          ) : null}
        </View>

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
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCell: {
    minWidth: "28%",
    gap: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  actionButton: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
