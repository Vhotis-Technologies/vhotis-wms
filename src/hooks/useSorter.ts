import { useCallback, useEffect, useMemo, useState } from "react";

import { INBOUND_QUEUE_STATUSES } from "@/constants/sorter";
import {
  getActivePutawayTarget,
  resolveNextPutawayStep,
} from "@/utils/sorterPutaway";
import type {
  AddReceiptLineParams,
  InboundShipmentDetail,
  InboundShipmentSummary,
  ReceiptLineDetail,
  ReceiptLineSummary,
  SortUiStep,
  SorterDashboardStats,
  TagReceiptLineResult,
} from "@/interfaces/sorter";
import { useAuthStore } from "@/store";
import * as sorterApi from "@/store/api/sorterApi";

interface UseSorterOptions {
  shipmentId?: string;
  lineId?: number;
  initialStep?: SortUiStep;
}

export function useSorter(options: UseSorterOptions = {}) {
  const { shipmentId, lineId, initialStep } = options;
  const employee = useAuthStore((state) => state.employee);
  const warehouseId = employee?.warehouse ?? 0;
  const employeeId = employee?.id ?? 0;

  const [shipments, setShipments] = useState<InboundShipmentSummary[]>([]);
  const [awaitingTag, setAwaitingTag] = useState<ReceiptLineSummary[]>([]);
  const [awaitingVerify, setAwaitingVerify] = useState<ReceiptLineSummary[]>([]);
  const [awaitingPutaway, setAwaitingPutaway] = useState<ReceiptLineSummary[]>([]);
  const [stats, setStats] = useState<SorterDashboardStats | null>(null);
  const [shipment, setShipment] = useState<InboundShipmentDetail | null>(null);
  const [line, setLine] = useState<ReceiptLineDetail | null>(null);
  const [uiStep, setUiStep] = useState<SortUiStep>(initialStep ?? "overview");
  const [scanPayload, setScanPayload] = useState("");
  const [activeContainerCode, setActiveContainerCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPutawayLocation, setLastPutawayLocation] = useState<string | null>(null);
  const [tagResult, setTagResult] = useState<TagReceiptLineResult | null>(null);

  const refreshHub = useCallback(async () => {
    if (!warehouseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [shipmentList, tagList, verifyList, putawayList, dashboardStats] =
        await Promise.all([
        sorterApi.listInboundShipments(warehouseId, INBOUND_QUEUE_STATUSES),
        sorterApi.listAwaitingTag(warehouseId),
        sorterApi.listAwaitingVerify(warehouseId),
        sorterApi.listAwaitingPutaway(warehouseId),
        sorterApi.getSorterStats(warehouseId),
      ]);
      setShipments(shipmentList);
      setAwaitingTag(tagList);
      setAwaitingVerify(verifyList);
      setAwaitingPutaway(putawayList);
      setStats(dashboardStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sorter queue.");
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId]);

  const loadShipment = useCallback(async (targetShipmentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await sorterApi.getShipment(targetShipmentId);
      setShipment(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load shipment.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLine = useCallback(
    async (targetLineId: number, targetShipmentId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await sorterApi.getReceiptLine(targetLineId, targetShipmentId);
        setLine(detail);
        if (initialStep) {
          setUiStep(initialStep);
        } else {
          setUiStep("overview");
        }
        setScanPayload("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load receipt line.");
      } finally {
        setIsLoading(false);
      }
    },
    [initialStep],
  );

  useEffect(() => {
    if (!shipmentId && !lineId) {
      refreshHub();
    }
  }, [shipmentId, lineId, refreshHub]);

  useEffect(() => {
    if (shipmentId && !lineId) {
      loadShipment(shipmentId);
    }
  }, [shipmentId, lineId, loadShipment]);

  useEffect(() => {
    if (lineId) {
      loadLine(lineId, shipmentId);
    }
  }, [lineId, shipmentId, loadLine]);

  const verifiedCount = useMemo(
    () => line?.stock_units.filter((u) => u.verified).length ?? 0,
    [line],
  );

  const totalUnits = line?.accepted_quantity ?? 0;
  const storedCount = line?.units_stored ?? 0;

  const putawayTarget = useMemo(() => {
    if (!line) return null;
    return getActivePutawayTarget(line, activeContainerCode);
  }, [line, activeContainerCode]);

  const remainingPutaway = useMemo(() => {
    if (!line) return 0;
    return Math.max(line.accepted_quantity - line.units_stored, 0);
  }, [line]);

  const beginVerify = useCallback(() => {
    setUiStep("verify");
    setScanPayload("");
    setError(null);
  }, []);

  const beginPutaway = useCallback(() => {
    if (!line) return;
    if (line.stage === "awaiting_verify") {
      setUiStep("verify");
      setScanPayload("");
      setError(null);
      return;
    }
    if (line.stage !== "awaiting_putaway" && line.units_stored < line.accepted_quantity) {
      setError("Complete verification before putaway.");
      return;
    }
    setUiStep(resolveNextPutawayStep(line));
    setScanPayload("");
    setError(null);
  }, [line]);

  const beginTag = useCallback(() => {
    setUiStep("tag");
    setError(null);
  }, []);

  const viewTagLabels = useCallback(() => {
    if (!line?.tagged) return;
    setTagResult({
      line,
      unit_codes: line.stock_units.map((unit) => unit.unit_code),
      container_codes: line.storage_containers.map(
        (container) => container.container_code,
      ),
    });
    setUiStep("tag");
    setError(null);
  }, [line]);

  const generateLabels = useCallback(async () => {
    if (!line || !lineId) return;
    if (line.tagged && line.stock_units.length > 0) {
      viewTagLabels();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await sorterApi.tagReceiptLine(
        lineId,
        line.shipment_id,
        employeeId,
      );
      setLine(result.line);
      setTagResult(result);
      setUiStep("tag");
      setScanPayload("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate labels.");
    } finally {
      setIsLoading(false);
    }
  }, [line, lineId, employeeId, viewTagLabels]);

  const submitUnitVerify = useCallback(
    async (payload?: string) => {
      if (!lineId) return;
      const value = (payload ?? scanPayload).trim();
      if (!value) {
        setError("Enter or scan a unit barcode.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const updated = await sorterApi.submitUnitVerify(
          lineId,
          value,
          line?.shipment_id,
        );
        setLine(updated);
        setScanPayload("");
        const allVerified = updated.stock_units.every((u) => u.verified);
        if (allVerified) {
          if (updated.packaging_mode === "boxed") {
            setUiStep("container");
          } else {
            setUiStep("putaway");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unit scan failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [lineId, line, scanPayload],
  );

  const submitContainerScan = useCallback(
    async (payload?: string) => {
      if (!lineId || !line) return;
      const value = (payload ?? scanPayload).trim();
      if (!value) {
        setError("Scan the container barcode.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const updated = await sorterApi.submitContainerVerify(
          lineId,
          value,
          line.shipment_id,
        );
        const container = updated.storage_containers.find(
          (c) => c.container_code.toUpperCase() === value.toUpperCase(),
        );
        if (!container) {
          throw new Error("Container barcode not recognized.");
        }
        setLine(updated);
        setActiveContainerCode(container.container_code);
        setScanPayload("");
        setUiStep("putaway");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Container scan failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [lineId, line, scanPayload],
  );

  const submitPutaway = useCallback(
    async (payload?: string) => {
      if (!lineId || !line) return;
      const location = (payload ?? scanPayload).trim();
      if (!location) {
        setError("Scan the storage location.");
        return;
      }
      const target = getActivePutawayTarget(line, activeContainerCode);
      if (!target) {
        setError("No verified stock is ready for putaway.");
        return;
      }
      if (!warehouseId) {
        setError("Warehouse context missing for putaway.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const containerCode =
          target.type === "container"
            ? activeContainerCode ?? target.code
            : undefined;
        const result = await sorterApi.submitPutaway({
          lineId,
          employeeId,
          warehouseId,
          shipmentId: line.shipment_id,
          locationPayload: location,
          unitCode: target.type === "unit" ? target.code : undefined,
          containerCode,
        });
        setLine(result.line);
        setLastPutawayLocation(result.location_code);
        setScanPayload("");
        setActiveContainerCode(null);
        setUiStep(
          result.receipt_line_finalized
            ? "confirmed"
            : resolveNextPutawayStep(result.line),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Putaway failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [lineId, line, scanPayload, employeeId, warehouseId, activeContainerCode],
  );

  const receiveLine = useCallback(
    async (params: AddReceiptLineParams): Promise<ReceiptLineDetail> => {
      setError(null);
      try {
        const created = await sorterApi.addReceiptLine(params);
        if (params.shipmentId) {
          await loadShipment(params.shipmentId);
        }
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to receive line.");
        throw err;
      }
    },
    [loadShipment],
  );

  const markArrived = useCallback(async () => {
    if (!shipmentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await sorterApi.arriveShipment(shipmentId);
      setShipment(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark arrived.");
    } finally {
      setIsLoading(false);
    }
  }, [shipmentId]);

  const completeShipment = useCallback(async () => {
    if (!shipmentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await sorterApi.completeReceiving(shipmentId);
      setShipment(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete receiving.");
    } finally {
      setIsLoading(false);
    }
  }, [shipmentId]);

  const advanceAfterTag = useCallback(() => {
    setUiStep("verify");
    setScanPayload("");
    setError(null);
  }, []);

  const resetToOverview = useCallback(() => {
    setUiStep("overview");
    setScanPayload("");
    setActiveContainerCode(null);
    setError(null);
  }, []);

  const advanceAfterConfirm = useCallback(() => {
    resetToOverview();
  }, [resetToOverview]);

  return {
    employee,
    shipments,
    awaitingTag,
    awaitingVerify,
    awaitingPutaway,
    stats,
    shipment,
    line,
    uiStep,
    scanPayload,
    setScanPayload,
    isLoading,
    error,
    refreshHub,
    loadShipment,
    loadLine,
    receiveLine,
    markArrived,
    completeShipment,
    beginTag,
    beginVerify,
    beginPutaway,
    generateLabels,
    viewTagLabels,
    advanceAfterTag,
    submitUnitVerify,
    submitContainerScan,
    submitPutaway,
    resetToOverview,
    advanceAfterConfirm,
    verifiedCount,
    totalUnits,
    storedCount,
    putawayTarget,
    remainingPutaway,
    lastPutawayLocation,
    activeContainerCode,
    tagResult,
  };
}
