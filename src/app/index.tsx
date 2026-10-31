import { MaterialIcons } from "@expo/vector-icons";
import * as Device from "expo-device";
import { type Href, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/store";

export default function Index() {
  const {
    loginFormData,
    isLoading,
    error,
    isAuthenticated,
    isAuthReady,
    updateLoginFormData,
    login,
    clearError,
    rememberMe,
    setRememberMe,
  } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const bgColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const buttonColor = useThemeColor({}, "button");
  const iconMuted = useThemeColor({}, "icons");
  const errorColor = useThemeColor({}, "error");
  const buttonTextColor = useThemeColor({}, "buttonText");

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      const employee = useAuthStore.getState().employee;
      router.replace(
        (employee?.is_supervisor
          ? "/main/supervisor"
          : "/main/LandingPageScreen") as Href,
      );
    }
  }, [isAuthReady, isAuthenticated]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /**
   * Method calls the login function and redirects to the main screen if successful.
   * The method checks the user roles to route them to the appropriate screen.
   * @returns 
   */
  const handleSignIn = async () => {
    clearError();

    if (!loginFormData.employee_id.trim()) {
      useAuthStore.setState({ error: "Please enter your employee ID." });
      return;
    }

    if (!loginFormData.password.trim()) {
      useAuthStore.setState({ error: "Please enter your password." });
      return;
    }

    try {
      const deviceId = Device.osInternalBuildId ?? Device.modelId ?? undefined;
      await login(deviceId);
      const employee = useAuthStore.getState().employee;
      router.replace(
        (employee?.is_supervisor
          ? "/main/supervisor"
          : "/main/LandingPageScreen") as Href,
      );
    } catch {
      // Error state is handled in the store.
    }
  };

  if (!isAuthReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={buttonColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: keyboardVisible ? 32 : insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: `${buttonColor}22` }]}>
              <StyledText variant="eyebrow" color={buttonColor}>
                Vhotis WMS
              </StyledText>
            </View>
            <StyledText variant="display" style={styles.title}>
              Welcome back
            </StyledText>
            <StyledText variant="body" color={iconMuted} style={styles.subtitle}>
              Sign in with your employee ID to start your warehouse shift.
            </StyledText>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: `${buttonColor}18` }]}>
                <MaterialIcons name="badge" size={22} color={buttonColor} />
              </View>
              <View style={styles.cardHeaderText}>
                <StyledText variant="headline">Employee sign in</StyledText>
                <StyledText variant="caption" color={iconMuted}>
                  Enter your floor credentials
                </StyledText>
              </View>
            </View>

            <StyledTextInput
              label="Employee ID"
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="e.g. WH-001"
              value={loginFormData.employee_id}
              onChangeText={(value) => updateLoginFormData("employee_id", value)}
              editable={!isLoading}
              returnKeyType="next"
            />

            <View style={styles.passwordWrap}>
              <StyledTextInput
                label="Password"
                secureTextEntry={!showPassword}
                placeholder="Enter password"
                value={loginFormData.password}
                onChangeText={(value) => updateLoginFormData("password", value)}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                inputStyle={styles.passwordInput}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((current) => !current)}
                hitSlop={8}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={iconMuted}
                />
              </Pressable>
            </View>

            <Pressable
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: rememberMe ? buttonColor : borderColor },
                  rememberMe && { backgroundColor: buttonColor },
                ]}
              >
                {rememberMe ? (
                  <MaterialIcons name="check" size={14} color={buttonTextColor} />
                ) : null}
              </View>
              <StyledText variant="bodyMedium" color={textColor}>
                Remember me
              </StyledText>
            </Pressable>

            {error ? (
              <View style={[styles.errorBanner, { borderColor: errorColor }]}>
                <MaterialIcons name="error-outline" size={18} color={errorColor} />
                <StyledText variant="label" color={errorColor} style={styles.errorText}>
                  {error}
                </StyledText>
              </View>
            ) : null}

            <StyledButton
              title="Sign in"
              variant="medium"
              onPress={handleSignIn}
              loading={isLoading}
              disabled={isLoading}
              buttonStyles={styles.signInButton}
            />
          </View>

          <StyledText variant="caption" color={iconMuted} style={styles.footerNote}>
            Credentials are stored securely on this device when remember me is enabled.
          </StyledText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    gap: 10,
    paddingTop: 8,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  title: {
    fontSize: 30,
  },
  subtitle: {
    lineHeight: 22,
    maxWidth: 320,
  },
  card: {
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: 28,
    minWidth: 35,
    minHeight: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
  },
  signInButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  footerNote: {
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
