import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import FloorScanPanel from "@/app/components/shared/FloorScanPanel";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import StyledTextInput from "@/app/components/StyledTextInput";
import { useThemeColor } from "@/hooks/useThemeColor";
import type {
  PickExceptionSummary,
  SupervisorRelocateLocation,
} from "@/interfaces/supervisor";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

interface RelocateLocationSheetProps {
  visible: boolean;
  exception: PickExceptionSummary;
  warehouseId: number;
  notes: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (locationId: number) => void | Promise<void>;
}

export default function RelocateLocationSheet({
  visible,
  exception,
  warehouseId,
  notes,
  loading = false,
  onClose,
  onConfirm,
}: RelocateLocationSheetProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");

  const [scanPayload, setScanPayload] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<SupervisorRelocateLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLocation = useMemo(
    () => locations.find((row) => row.id === selectedLocationId) ?? null,
    [locations, selectedLocationId],
  );

  const resetState = useCallback(() => {
    setScanPayload("");
    setSearchQuery("");
    setLocations([]);
    setSelectedLocationId(null);
    setError(null);
    setIsSearching(false);
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setError(null);

    supervisorApi
      .searchRelocateLocations({
        exceptionId: exception.id,
        warehouseId,
      })
      .then((rows) => {
        if (!cancelled) {
          setLocations(rows);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError
              ? err.message
              : "Unable to load alternate locations.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [exception.id, resetState, visible, warehouseId]);

  const runSearch = useCallback(
    async (query: string) => {
      setIsSearching(true);
      setError(null);
      try {
        const rows = await supervisorApi.searchRelocateLocations({
          exceptionId: exception.id,
          warehouseId,
          query,
        });
        setLocations(rows);
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Unable to search locations.",
        );
      } finally {
        setIsSearching(false);
      }
    },
    [exception.id, warehouseId],
  );

  const handleScanSubmit = async (payload?: string) => {
    const value = (payload ?? scanPayload).trim();
    if (!value) {
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const resolved = await supervisorApi.resolveLocationScan(
        value,
        warehouseId,
      );
      if (!resolved) {
        setError("Scan did not resolve to a warehouse location.");
        return;
      }

      const matches = await supervisorApi.searchRelocateLocations({
        exceptionId: exception.id,
        warehouseId,
        query: resolved.code,
      });
      const exact =
        matches.find((row) => row.id === resolved.locationId) ??
        matches.find((row) => row.code === resolved.code);

      if (!exact) {
        setError(
          `${resolved.code} is not an eligible relocate target for this pick line.`,
        );
        return;
      }

      setLocations((current) => {
        if (current.some((row) => row.id === exact.id)) {
          return current;
        }
        return [exact, ...current];
      });
      setSelectedLocationId(exact.id);
      setSearchQuery(exact.code);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Unable to resolve location scan.",
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: cardColor }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <StyledText variant="headline">Relocate pick line</StyledText>
            <StyledText variant="body" color={iconMuted}>
              Scan a bin label or search for an alternate location with at least{" "}
              {exception.quantityRequired} available units.
            </StyledText>
          </View>

          <View style={[styles.section, { borderColor }]}>
            <FloorScanPanel
              prompt="Scan location"
              detail="Scan LOC:WH:BIN or WH:BIN"
              scanStep="location"
              value={scanPayload}
              onChangeText={setScanPayload}
              onSubmit={handleScanSubmit}
              isLoading={isScanning}
              enabled={visible}
              confirmTitle={isScanning ? "Resolving scan..." : "Resolve scan"}
              inputPlaceholder="Scan LOC:WH:BIN or WH:BIN"
              variant="compact"
            />
          </View>

          <View style={[styles.section, { borderColor }]}>
            <StyledTextInput
              label="Search locations"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Aisle, bay, or location code"
              onSubmitEditing={() => {
                void runSearch(searchQuery);
              }}
            />
            <StyledButton
              title={isSearching ? "Searching..." : "Search"}
              variant="medium"
              disabled={isSearching}
              onPress={() => {
                void runSearch(searchQuery);
              }}
              buttonStyles={[styles.inlineButton, { backgroundColor: buttonColor }]}
            />
          </View>

          {error ? (
            <StyledText variant="label" color={errorColor}>
              {error}
            </StyledText>
          ) : null}

          {isSearching && locations.length === 0 ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={buttonColor} />
            </View>
          ) : null}

          {!isSearching && locations.length === 0 ? (
            <View style={[styles.emptyState, { borderColor }]}>
              <StyledText variant="body" color={iconMuted}>
                No eligible locations found. Try another search or verify stock
                was put away at a pick face.
              </StyledText>
            </View>
          ) : (
            <View style={styles.list}>
              {locations.map((location) => {
                const selected = location.id === selectedLocationId;
                return (
                  <Pressable
                    key={location.id}
                    onPress={() => setSelectedLocationId(location.id)}
                    style={[
                      styles.locationCard,
                      {
                        backgroundColor: selected
                          ? `${successColor}12`
                          : cardColor,
                        borderColor: selected ? successColor : borderColor,
                      },
                    ]}
                  >
                    <View style={styles.locationHeader}>
                      <StyledText variant="monoSmall" color={successColor}>
                        {location.code}
                      </StyledText>
                      <ZoneBadge zone={location.zone} />
                    </View>
                    <StyledText variant="body">{location.locationDetail}</StyledText>
                    <StyledText variant="caption" color={iconMuted}>
                      {location.locationType.replace("_", " ")} ·{" "}
                      {location.availableQuantity} available
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>
          )}

          {selectedLocation ? (
            <View style={[styles.confirmBox, { borderColor, backgroundColor: `${successColor}10` }]}>
              <StyledText variant="label" color={successColor}>
                Selected destination
              </StyledText>
              <StyledText variant="bodyMedium">{selectedLocation.locationDetail}</StyledText>
              <StyledText variant="caption" color={iconMuted}>
                {selectedLocation.code} · {selectedLocation.availableQuantity} units
              </StyledText>
            </View>
          ) : null}

          <View style={styles.footer}>
            <StyledButton
              title="Cancel"
              variant="medium"
              onPress={onClose}
              disabled={loading}
              buttonStyles={[
                styles.footerButton,
                { borderColor, backgroundColor: cardColor, borderWidth: 1 },
              ]}
            />
            <StyledButton
              title={loading ? "Relocating..." : "Confirm relocate"}
              variant="medium"
              disabled={loading || !selectedLocationId}
              onPress={() => {
                if (selectedLocationId) {
                  void onConfirm(selectedLocationId);
                }
              }}
              buttonStyles={[
                styles.footerButton,
                { backgroundColor: buttonColor, borderWidth: 0 },
              ]}
            />
          </View>

          {notes.trim() ? (
            <StyledText variant="caption" color={iconMuted}>
              Supervisor notes will be saved with this resolution.
            </StyledText>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    marginTop: 48,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  container: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 10,
  },
  inlineButton: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loadingBlock: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  list: {
    gap: 10,
  },
  locationCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  confirmBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
});
