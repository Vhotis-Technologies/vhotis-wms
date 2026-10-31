import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { flatButton, flatPanel, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { ManifestLine, PackagingMode } from "@/interfaces/sorter";
import {
  computeAcceptedQuantity,
  formatQuantityVariance,
  receiveLineWarning,
  validateReceiveLineInput,
} from "@/utils/receiveLineValidation";

interface ReceiveLineSheetProps {
  visible: boolean;
  manifestLine: ManifestLine | null;
  onClose: () => void;
  onSubmit: (values: {
    receivedQuantity: number;
    damagedQuantity: number;
    packagingMode: PackagingMode;
    cartonCount?: number;
    unitsPerCarton?: number;
  }) => Promise<void>;
  submitting?: boolean;
  submitError?: string | null;
}

export default function ReceiveLineSheet({
  visible,
  manifestLine,
  onClose,
  onSubmit,
  submitting,
  submitError,
}: ReceiveLineSheetProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const buttonColor = useThemeColor({}, "button");
  const errorColor = useThemeColor({}, "error");
  const warningColor = useThemeColor({}, "warning");
  const successColor = useThemeColor({}, "success");
  const textColor = useThemeColor({}, "text");
  const bandForeground = useThemeColor({}, "background");

  const [receivedQty, setReceivedQty] = useState("");
  const [damagedQty, setDamagedQty] = useState("0");
  const [packagingMode, setPackagingMode] = useState<PackagingMode>("loose");
  const [cartonCount, setCartonCount] = useState("");
  const [unitsPerCarton, setUnitsPerCarton] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const resetForm = () => {
    if (!manifestLine) return;
    setReceivedQty(String(manifestLine.declared_quantity));
    setDamagedQty("0");
    setPackagingMode("loose");
    setCartonCount("");
    setUnitsPerCarton("");
    setLocalError(null);
  };

  const handleShow = () => {
    if (manifestLine) {
      setReceivedQty(String(manifestLine.declared_quantity));
      setDamagedQty("0");
      setPackagingMode("loose");
      setCartonCount("");
      setUnitsPerCarton("");
      setLocalError(null);
    }
  };

  const parsedValues = useMemo(() => {
    const received = parseInt(receivedQty, 10);
    const damaged = parseInt(damagedQty, 10);
    const carton = parseInt(cartonCount, 10);
    const perCarton = parseInt(unitsPerCarton, 10);
    return {
      receivedQuantity: Number.isNaN(received) ? 0 : received,
      damagedQuantity: Number.isNaN(damaged) ? 0 : damaged,
      packagingMode,
      cartonCount: packagingMode === "boxed" && !Number.isNaN(carton) ? carton : undefined,
      unitsPerCarton:
        packagingMode === "boxed" && !Number.isNaN(perCarton) ? perCarton : undefined,
    };
  }, [receivedQty, damagedQty, packagingMode, cartonCount, unitsPerCarton]);

  const acceptedQuantity = computeAcceptedQuantity(
    parsedValues.receivedQuantity,
    parsedValues.damagedQuantity,
  );

  const varianceLabel = manifestLine
    ? formatQuantityVariance(parsedValues.receivedQuantity, manifestLine.declared_quantity)
    : null;

  const warningLabel = receiveLineWarning(parsedValues);

  const boxedTotal =
    parsedValues.cartonCount != null && parsedValues.unitsPerCarton != null
      ? parsedValues.cartonCount * parsedValues.unitsPerCarton
      : null;

  const handleSubmit = async () => {
    if (!manifestLine) return;

    if (!manifestLine.product_id) {
      setLocalError(
        "Catalog product is not linked yet. Confirm seller payment and catalog sync before receiving.",
      );
      return;
    }

    const validationError = validateReceiveLineInput(parsedValues);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    try {
      await onSubmit(parsedValues);
      resetForm();
    } catch {
      // Parent surfaces API errors via submitError.
    }
  };

  const displayError = localError ?? submitError;

  if (!manifestLine) return null;

  const catalogReady = Boolean(manifestLine.product_id);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, flatPanel, { backgroundColor: cardColor, borderColor }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.sheetBand, { backgroundColor: textColor }]}>
            <StyledText variant="eyebrow" style={[styles.sheetBandText, { color: bandForeground }]}>
              RECEIVE LINE
            </StyledText>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <StyledText variant="headline">{manifestLine.declared_name}</StyledText>
            <StyledText variant="body" color={iconMuted}>
              Declared {manifestLine.declared_quantity} {manifestLine.declared_unit}
            </StyledText>
            {manifestLine.product_name ? (
              <StyledText variant="monoSmall" color={iconMuted}>
                Catalog · {manifestLine.product_name}
              </StyledText>
            ) : null}

            {!catalogReady ? (
              <View
                style={[
                  styles.banner,
                  flatPanel,
                  { backgroundColor: `${warningColor}12`, borderColor: warningColor },
                ]}
              >
                <StyledText variant="label" color={warningColor}>
                  Catalog product not linked — receiving is blocked until payment sync completes.
                </StyledText>
              </View>
            ) : null}

            <View
              style={[
                styles.summaryRow,
                flatPanel,
                { backgroundColor: `${buttonColor}08`, borderColor },
              ]}
            >
              <StyledText variant="eyebrow" color={iconMuted}>
                ACCEPTED AFTER DAMAGE
              </StyledText>
              <StyledText variant="display" style={styles.acceptedValue}>
                {acceptedQuantity}
              </StyledText>
              {varianceLabel ? (
                <StyledText
                  variant="caption"
                  color={varianceLabel.startsWith("+") ? warningColor : errorColor}
                >
                  {varianceLabel}
                </StyledText>
              ) : (
                <StyledText variant="caption" color={successColor}>
                  Matches declared quantity
                </StyledText>
              )}
            </View>

            <StyledTextInput
              label="Received quantity"
              value={receivedQty}
              onChangeText={(value) => {
                setReceivedQty(value);
                setLocalError(null);
              }}
              keyboardType="number-pad"
              inputStyle={styles.flatInput}
            />
            <StyledTextInput
              label="Damaged quantity"
              value={damagedQty}
              onChangeText={(value) => {
                setDamagedQty(value);
                setLocalError(null);
              }}
              keyboardType="number-pad"
              inputStyle={styles.flatInput}
            />

            <StyledText variant="eyebrow" color={iconMuted} style={styles.modeLabel}>
              PACKAGING MODE
            </StyledText>
            <View style={[styles.modeRow, flatPanel, { borderColor }]}>
              {(["loose", "boxed"] as PackagingMode[]).map((mode, index) => {
                const active = packagingMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      setPackagingMode(mode);
                      setLocalError(null);
                    }}
                    style={[
                      styles.modeChip,
                      index > 0 ? { borderLeftWidth: SORTER_BORDER, borderLeftColor: borderColor } : null,
                      {
                        backgroundColor: active ? `${buttonColor}18` : cardColor,
                      },
                    ]}
                  >
                    <StyledText variant="label" color={active ? buttonColor : iconMuted}>
                      {mode === "loose" ? "Loose units" : "Boxed / carton"}
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>

            {packagingMode === "boxed" ? (
              <>
                <StyledTextInput
                  label="Carton count"
                  value={cartonCount}
                  onChangeText={(value) => {
                    setCartonCount(value);
                    setLocalError(null);
                  }}
                  keyboardType="number-pad"
                  inputStyle={styles.flatInput}
                />
                <StyledTextInput
                  label="Units per carton"
                  value={unitsPerCarton}
                  onChangeText={(value) => {
                    setUnitsPerCarton(value);
                    setLocalError(null);
                  }}
                  keyboardType="number-pad"
                  inputStyle={styles.flatInput}
                />
                <StyledText variant="caption" color={iconMuted}>
                  {boxedTotal != null
                    ? `Packed total: ${boxedTotal} · must equal accepted ${acceptedQuantity}`
                    : `Cartons × units must equal accepted ${acceptedQuantity}`}
                </StyledText>
              </>
            ) : null}

            {warningLabel ? (
              <StyledText variant="label" color={warningColor}>
                {warningLabel}
              </StyledText>
            ) : null}

            {displayError ? (
              <StyledText variant="label" color={errorColor}>
                {displayError}
              </StyledText>
            ) : null}

            <StyledButton
              title="Confirm receive"
              onPress={handleSubmit}
              variant="large"
              loading={submitting}
              disabled={!catalogReady}
              buttonStyles={[flatButton, styles.submitButton]}
            />
            <Pressable onPress={onClose} style={[styles.cancel, { borderTopColor: borderColor }]}>
              <StyledText variant="bodyMedium" color={iconMuted}>
                Cancel
              </StyledText>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    overflow: "hidden",
  },
  sheetBand: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetBandText: {
    letterSpacing: 1.4,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  banner: {
    padding: 12,
  },
  summaryRow: {
    padding: 14,
    gap: 6,
  },
  acceptedValue: {
    fontSize: 32,
  },
  modeLabel: {
    marginTop: 4,
  },
  modeRow: {
    flexDirection: "row",
    overflow: "hidden",
  },
  modeChip: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 16,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: SORTER_BORDER,
    marginTop: 4,
  },
  flatInput: {
    borderRadius: 0,
  },
});
