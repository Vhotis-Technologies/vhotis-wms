import { MaterialIcons } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { FloorChromeFooter } from "@/app/components/shared/FloorLayout";
import { flatButton, flatPanel, FLOOR_ACCENT_WIDTH, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import type { WorkArea } from "@/interfaces/auth";
import {
  formatWorkAreaLabel,
  useFloorSession,
} from "@/hooks/useFloorSession";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/store";

interface WorkAreaOption {
  area: WorkArea;
  title: string;
  description: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  accentKey: "success" | "button" | "warning";
}

const WORK_AREAS: WorkAreaOption[] = [
  {
    area: "pick",
    title: "Picking floor",
    description: "Pick items for outbound customer orders",
    route: "/main/picker" as Href,
    icon: "inventory-2",
    accentKey: "success",
  },
  {
    area: "pack",
    title: "Packing",
    description: "Pack picked orders and prepare for dispatch",
    route: "/main/packer" as Href,
    icon: "local-shipping",
    accentKey: "button",
  },
  {
    area: "inbound",
    title: "Inbound sorting",
    description: "Receive, tag, and put away seller shipments",
    route: "/main/sorter" as Href,
    icon: "move-to-inbox",
    accentKey: "warning",
  },
];

function WorkAreaRow({
  option,
  onSelect,
  isEntering,
  disabled,
  isLast,
}: {
  option: WorkAreaOption;
  onSelect: () => void;
  isEntering: boolean;
  disabled: boolean;
  isLast: boolean;
}) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const accentColor = useThemeColor({}, option.accentKey);

  return (
    <View
      style={[
        styles.workRow,
        !isLast ? { borderBottomWidth: FLOOR_BORDER, borderBottomColor: borderColor } : null,
        { backgroundColor: cardColor },
      ]}
    >
      <View style={[styles.workStripe, { backgroundColor: accentColor }]} />
      <View style={styles.workBody}>
        <View style={styles.workTop}>
          <View style={[styles.iconBox, { borderColor, backgroundColor: `${accentColor}14` }]}>
            <MaterialIcons name={option.icon} size={22} color={accentColor} />
          </View>
          <View style={styles.workCopy}>
            <StyledText variant="headline">{option.title}</StyledText>
            <StyledText variant="caption" color={iconMuted}>
              {option.description}
            </StyledText>
          </View>
        </View>
        <StyledButton
          title={isEntering ? "Starting shift…" : "Enter floor"}
          variant="medium"
          onPress={onSelect}
          disabled={disabled}
          buttonStyles={[
            flatButton,
            styles.enterButton,
            { backgroundColor: accentColor, borderWidth: 0 },
          ]}
        />
      </View>
    </View>
  );
}

export default function MainLandingScreen() {
  const iconMuted = useThemeColor({}, "icons");
  const errorColor = useThemeColor({}, "error");
  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const buttonColor = useThemeColor({}, "button");
  const textColor = useThemeColor({}, "text");
  const bandForeground = useThemeColor({}, "background");

  const employee = useAuthStore((state) => state.employee);
  const { enterWorkArea } = useFloorSession();
  const [enteringArea, setEnteringArea] = useState<WorkArea | null>(null);
  const [enterError, setEnterError] = useState<string | null>(null);

  const employeeLabel = employee?.full_name ?? employee?.employee_id ?? "Employee";
  const employeeId = employee?.employee_id;
  const activeShiftLabel = employee?.active_shift
    ? `On shift · ${formatWorkAreaLabel(employee.active_shift.work_area)}`
    : null;

  const handleSelect = async (option: WorkAreaOption) => {
    setEnterError(null);
    setEnteringArea(option.area);

    const result = await enterWorkArea(option.area);
    setEnteringArea(null);

    if (!result.ok) {
      setEnterError(result.error);
      return;
    }

    router.push(option.route);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, flatPanel, { borderColor, backgroundColor: cardColor }]}>
          <View style={[styles.heroBand, { backgroundColor: textColor }]}>
            <StyledText variant="eyebrow" style={[styles.heroBandText, { color: bandForeground }]}>
              VHOTIS · FLOOR WORKSPACE
            </StyledText>
          </View>
          <View style={styles.heroBody}>
            <StyledText variant="display" style={styles.title}>
              Where are you working?
            </StyledText>
            <StyledText variant="body" color={iconMuted}>
              Choose your area for this shift. Switch anytime from the floor menu.
            </StyledText>
          </View>
        </View>

        <View style={[styles.employeeBar, flatPanel, { borderColor, backgroundColor: cardColor }]}>
          <View style={[styles.employeeStripe, { backgroundColor: buttonColor }]} />
          <View style={[styles.avatarBox, { borderColor, backgroundColor: `${buttonColor}12` }]}>
            <MaterialIcons name="person" size={20} color={buttonColor} />
          </View>
          <View style={styles.employeeCopy}>
            <StyledText variant="bodyMedium">{employeeLabel}</StyledText>
            {employeeId ? (
              <StyledText variant="monoSmall" color={iconMuted}>
                {employeeId}
              </StyledText>
            ) : null}
            {activeShiftLabel ? (
              <StyledText variant="caption" color={buttonColor}>
                {activeShiftLabel}
              </StyledText>
            ) : null}
          </View>
          <View style={[styles.shiftIndicator, { backgroundColor: buttonColor }]} />
        </View>

        {enterError ? (
          <View style={[styles.errorBar, flatPanel, { borderColor: errorColor }]}>
            <StyledText variant="label" color={errorColor}>
              {enterError}
            </StyledText>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <StyledText variant="eyebrow" color={iconMuted}>
            SELECT WORK AREA
          </StyledText>
        </View>

        <View style={[styles.workList, flatPanel, { borderColor }]}>
          {WORK_AREAS.map((option, index) => (
            <WorkAreaRow
              key={option.area}
              option={option}
              isLast={index === WORK_AREAS.length - 1}
              onSelect={() => {
                void handleSelect(option);
              }}
              isEntering={enteringArea === option.area}
              disabled={enteringArea !== null}
            />
          ))}
        </View>

        <FloorChromeFooter />
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
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    overflow: "hidden",
  },
  heroBand: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroBandText: {
    letterSpacing: 1.6,
  },
  heroBody: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 28,
  },
  employeeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  employeeStripe: {
    width: FLOOR_ACCENT_WIDTH,
    alignSelf: "stretch",
  },
  avatarBox: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: FLOOR_BORDER,
  },
  employeeCopy: {
    flex: 1,
    gap: 2,
    paddingVertical: 14,
  },
  shiftIndicator: {
    width: 8,
    height: 8,
    marginRight: 14,
  },
  errorBar: {
    padding: 12,
  },
  sectionHeader: {
    marginTop: 4,
  },
  workList: {
    overflow: "hidden",
  },
  workRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  workStripe: {
    width: FLOOR_ACCENT_WIDTH,
  },
  workBody: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  workTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: FLOOR_BORDER,
  },
  workCopy: {
    flex: 1,
    gap: 4,
  },
  enterButton: {
    width: "100%",
    paddingVertical: 14,
  },
});
