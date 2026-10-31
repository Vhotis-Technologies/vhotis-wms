import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import {
  formatPickExceptionLabel,
  PICK_EXCEPTION_OPTIONS,
  pickExceptionUsesQuantity,
} from "@/constants/picker";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickExceptionType, PickLine, PickExceptionPhotoDraft } from "@/interfaces/picker";
import {
  capturePickExceptionPhoto,
  MAX_PICK_EXCEPTION_PHOTOS,
  pickExceptionPhotoHint,
  pickExceptionRequiresPhotos,
  pickPickExceptionPhotoFromLibrary,
} from "@/utils/pickExceptionPhoto";

export interface ShortPickSubmitPayload {
  type: PickExceptionType;
  quantityFound?: number;
  notes?: string;
  photos?: PickExceptionPhotoDraft[];
}

interface ShortPickSheetProps {
  visible: boolean;
  line?: PickLine | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: ShortPickSubmitPayload) => void | Promise<void>;
}

export default function ShortPickSheet({
  visible,
  line,
  loading = false,
  onClose,
  onSubmit,
}: ShortPickSheetProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const errorColor = useThemeColor({}, "error");

  const [selectedType, setSelectedType] = useState<PickExceptionType | null>(null);
  const [quantityText, setQuantityText] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PickExceptionPhotoDraft[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedType(null);
      setQuantityText("");
      setNotes("");
      setPhotos([]);
      setValidationError(null);
      setPhotoError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!selectedType || !line) {
      return;
    }
    if (selectedType === "location_empty") {
      setQuantityText("0");
      return;
    }
    if (selectedType === "short_pick") {
      setQuantityText(String(line.quantity_picked));
    }
  }, [selectedType, line]);

  const showQuantityField = selectedType
    ? pickExceptionUsesQuantity(selectedType)
    : false;

  const quantityHint = useMemo(() => {
    if (!line || !selectedType) {
      return undefined;
    }
    if (selectedType === "location_empty") {
      return "Nothing available at this bin.";
    }
    return `${line.quantity_picked} already picked · ${line.quantity_required} required on this line`;
  }, [line, selectedType]);

  const photoHint = selectedType ? pickExceptionPhotoHint(selectedType) : undefined;

  const addPhoto = async (source: "camera" | "library") => {
    if (loading || photos.length >= MAX_PICK_EXCEPTION_PHOTOS) {
      return;
    }
    setPhotoError(null);
    try {
      const draft =
        source === "camera"
          ? await capturePickExceptionPhoto()
          : await pickPickExceptionPhotoFromLibrary();
      if (draft) {
        setPhotos((current) => [...current, draft].slice(0, MAX_PICK_EXCEPTION_PHOTOS));
      }
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Unable to add photo.");
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedType) {
      return;
    }

    let quantityFound: number | undefined;
    if (pickExceptionUsesQuantity(selectedType)) {
      const parsed = Number.parseInt(quantityText.trim(), 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        setValidationError("Enter a valid quantity (0 or more).");
        return;
      }
      if (line && parsed > line.quantity_required) {
        setValidationError(
          `Quantity found cannot exceed ${line.quantity_required} required.`,
        );
        return;
      }
      quantityFound = parsed;
    }

    if (pickExceptionRequiresPhotos(selectedType) && photos.length === 0) {
      setValidationError("Add at least one photo for this exception type.");
      return;
    }

    setValidationError(null);
    void onSubmit({
      type: selectedType,
      quantityFound,
      notes: notes.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: cardColor }]}
          onPress={(event) => event.stopPropagation()}
        >
          {selectedType ? (
            <>
              <Pressable
                disabled={loading}
                onPress={() => {
                  setSelectedType(null);
                  setValidationError(null);
                }}
              >
                <StyledText variant="label" color={iconMuted}>
                  ← Choose a different reason
                </StyledText>
              </Pressable>
              <StyledText variant="headline" style={styles.title}>
                {formatPickExceptionLabel(selectedType)}
              </StyledText>
              {line ? (
                <StyledText variant="label" color={iconMuted} style={styles.subtitle}>
                  {line.product_name} · {line.location_code}
                </StyledText>
              ) : null}
              <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
                {showQuantityField ? (
                  <StyledTextInput
                    label={
                      selectedType === "location_empty"
                        ? "Quantity found"
                        : "Units found at location"
                    }
                    value={quantityText}
                    onChangeText={setQuantityText}
                    keyboardType="number-pad"
                    editable={selectedType !== "location_empty" && !loading}
                    placeholder="0"
                  />
                ) : null}
                {quantityHint ? (
                  <StyledText variant="caption" color={iconMuted}>
                    {quantityHint}
                  </StyledText>
                ) : null}
                <StyledTextInput
                  label="Notes for supervisor (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                  placeholder="Describe what you found on the floor"
                  inputStyle={styles.notesInput}
                />
                <View style={styles.photoSection}>
                  <StyledText variant="label" style={styles.photoLabel}>
                    Evidence photos
                  </StyledText>
                  {photoHint ? (
                    <StyledText variant="caption" color={iconMuted}>
                      {photoHint}
                    </StyledText>
                  ) : null}
                  <View style={styles.photoRow}>
                    {photos.map((photo, index) => (
                      <View key={`${photo.uri}-${index}`} style={styles.photoThumbWrap}>
                        <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                        <Pressable
                          style={styles.removePhoto}
                          disabled={loading}
                          onPress={() =>
                            setPhotos((current) => current.filter((_, i) => i !== index))
                          }
                        >
                          <StyledText variant="caption" color={iconMuted}>
                            Remove
                          </StyledText>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  {photos.length < MAX_PICK_EXCEPTION_PHOTOS ? (
                    <View style={styles.photoActions}>
                      <StyledButton
                        title="Take photo"
                        onPress={() => addPhoto("camera")}
                        variant="tonal"
                        disabled={loading}
                        buttonStyles={styles.photoButton}
                      />
                      <StyledButton
                        title="Choose photo"
                        onPress={() => addPhoto("library")}
                        variant="tonal"
                        disabled={loading}
                        buttonStyles={styles.photoButton}
                      />
                    </View>
                  ) : null}
                  {photoError ? (
                    <StyledText variant="label" color={errorColor}>
                      {photoError}
                    </StyledText>
                  ) : null}
                </View>
                {validationError ? (
                  <StyledText variant="label" color={errorColor}>
                    {validationError}
                  </StyledText>
                ) : null}
              </ScrollView>
              <View style={styles.actions}>
                <StyledButton
                  title="Submit to supervisor"
                  onPress={handleSubmit}
                  variant="large"
                  loading={loading}
                  buttonStyles={styles.submitButton}
                />
                <Pressable style={styles.cancel} onPress={handleClose} disabled={loading}>
                  <StyledText variant="bodyMedium" color={iconMuted}>
                    Cancel
                  </StyledText>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <StyledText variant="headline">Report a problem</StyledText>
              <StyledText variant="label" color={iconMuted} style={styles.subtitle}>
                Supervisor will review before picking continues on this line.
              </StyledText>
              <ScrollView style={styles.list}>
                {PICK_EXCEPTION_OPTIONS.map((option) => (
                  <Pressable
                    key={option.type}
                    style={[styles.option, { borderBottomColor: borderColor }]}
                    onPress={() => setSelectedType(option.type)}
                  >
                    <StyledText variant="body">{option.label}</StyledText>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable style={styles.cancel} onPress={handleClose}>
                <StyledText variant="bodyMedium" color={iconMuted}>
                  Cancel
                </StyledText>
              </Pressable>
            </>
          )}
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
    padding: 0,
    maxHeight: "80%",
    overflow: "hidden",
  },
  title: {
    marginTop: 12,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
  },
  list: {
    marginBottom: 12,
  },
  form: {
    marginBottom: 12,
    gap: 12,
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  photoSection: {
    gap: 8,
  },
  photoLabel: {
    fontWeight: "600",
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoThumbWrap: {
    gap: 4,
    width: 96,
  },
  photoThumb: {
    width: 96,
    height: 96,
    borderRadius: 0,
  },
  removePhoto: {
    alignItems: "center",
  },
  photoActions: {
    flexDirection: "row",
    gap: 8,
  },
  photoButton: {
    flex: 1,
    borderRadius: 0,
  },
  actions: {
    gap: 8,
  },
  submitButton: {
    borderRadius: 0,
    paddingVertical: 14,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: 14,
  },
});
