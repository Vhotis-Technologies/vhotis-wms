import { useCallback, useEffect, useMemo, useState } from "react";

import {
  formatPickExceptionLabel,
  selectPriorityPickJob,
} from "@/constants/picker";
import type {
  PickExceptionPhotoDraft,
  PickExceptionType,
  PickJobDetail,
  PickJobSummary,
  PickLine,
  PickerDashboardStats,
  PickScanType,
  PickUiStep,
} from "@/interfaces/picker";
import { useAuthStore } from "@/store";
import * as pickerApi from "@/store/api/pickerApi";
import {
  isPickJobFullyPicked,
  isPickJobReadyForPack,
} from "@/utils/pickerJob";
import {
  formatScanSuccessMessage,
  getNextScanTypeForLine,
  validateScanStep,
} from "@/utils/pickerScan";

interface UsePickerOptions {
  jobId?: string;
  initialStep?: PickUiStep;
}

export function usePicker(options: UsePickerOptions = {}) {
  const { jobId, initialStep } = options;
  const employee = useAuthStore((state) => state.employee);
  const warehouseId = employee?.warehouse ?? 0;
  const pickerId = employee?.id ?? 0;

  const [jobs, setJobs] = useState<PickJobSummary[]>([]);
  const [stats, setStats] = useState<PickerDashboardStats | null>(null);
  const [job, setJob] = useState<PickJobDetail | null>(null);
  const [uiStep, setUiStep] = useState<PickUiStep>(initialStep ?? "overview");
  const [scanStep, setScanStep] = useState<PickScanType>("location");
  const [scanPayload, setScanPayload] = useState("");
  const [lastPickedUnitCode, setLastPickedUnitCode] = useState<string | null>(null);
  const [confirmedLine, setConfirmedLine] = useState<PickLine | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [exceptionNotice, setExceptionNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshJobs = useCallback(async () => {
    if (!warehouseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const jobList = await pickerApi.listPickJobs(warehouseId);
      const dashboardStats = await pickerApi.getPickerStats(jobList.length);
      setJobs(jobList);
      setStats(dashboardStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pick jobs.");
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId]);

  const loadJob = useCallback(
    async (targetJobId: string) => {
      if (!warehouseId) return;
      setIsLoading(true);
      setError(null);
      try {
        const detail = await pickerApi.getPickJob(warehouseId, targetJobId);
        setJob(detail);
        setUiStep("overview");
        setScanPayload("");
        setLastPickedUnitCode(null);
        setConfirmedLine(null);
        setScanSuccessMessage(null);
        setExceptionNotice(null);
      } catch (err) {
        setJob(null);
        setError(err instanceof Error ? err.message : "Unable to load pick job.");
      } finally {
        setIsLoading(false);
      }
    },
    [warehouseId],
  );

  const refreshJobDetail = useCallback(
    async (targetJobId: string) => {
      if (!warehouseId) return null;
      try {
        const detail = await pickerApi.getPickJob(warehouseId, targetJobId);
        setJob(detail);
        return detail;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to refresh pick job.");
        return null;
      }
    },
    [warehouseId],
  );

  useEffect(() => {
    if (!jobId) {
      refreshJobs();
    }
  }, [jobId, refreshJobs]);

  useEffect(() => {
    if (jobId) {
      loadJob(jobId);
    }
  }, [jobId, loadJob]);

  const activeLine = useMemo<PickLine | null>(() => {
    if (!job) return null;
    return job.pick_lines.find((line) => line.status === "active") ?? null;
  }, [job]);

  const jobComplete = useMemo(
    () => (job ? isPickJobFullyPicked(job) : false),
    [job],
  );

  const jobReadyForPack = useMemo(
    () => (job ? isPickJobReadyForPack(job) : false),
    [job],
  );

  const completedCount = useMemo(() => {
    if (!job) return 0;
    return job.pick_lines.filter(
      (line) => line.quantity_picked >= line.quantity_required,
    ).length;
  }, [job]);

  const currentItemIndex = useMemo(() => {
    if (!job || !activeLine) return completedCount + 1;
    const index = job.pick_lines.findIndex((line) => line.id === activeLine.id);
    return index >= 0 ? index + 1 : completedCount + 1;
  }, [job, activeLine, completedCount]);

  const totalItems = job?.pick_lines.length ?? 0;

  const unitProgressCurrent = activeLine?.quantity_picked ?? 0;
  const unitProgressTotal = activeLine?.quantity_required ?? 0;

  const progressLabel = useMemo(() => {
    if (!job) return "";
    return `Item ${currentItemIndex} of ${totalItems}`;
  }, [job, currentItemIndex, totalItems]);

  const progressDoneLabel = useMemo(() => {
    if (!job) return "";
    return `${completedCount} / ${totalItems} done`;
  }, [job, completedCount, totalItems]);

  const nextScanType = useMemo<PickScanType>(() => {
    if (!activeLine) return "location";
    return getNextScanTypeForLine(activeLine);
  }, [activeLine]);

  useEffect(() => {
    if (uiStep !== "scan" || !activeLine) return;
    setScanStep(getNextScanTypeForLine(activeLine));
  }, [uiStep, activeLine]);

  const beginScan = useCallback(async () => {
    if (!jobId || !activeLine) return;
    if (activeLine.has_pending_exception) {
      setError("This line is blocked pending supervisor review.");
      return;
    }
    if (jobReadyForPack) {
      setError("Pick work is complete. Hand off this order to the pack station.");
      return;
    }

    setError(null);
    setScanSuccessMessage(null);

    if (job?.status === "reserved") {
      setIsLoading(true);
      try {
        const updated = await pickerApi.startPickJob(warehouseId, jobId, pickerId);
        setJob(updated);
        const line = updated.pick_lines.find((entry) => entry.status === "active");
        if (!line) {
          setError("No pick lines are ready to scan.");
          return;
        }
        setUiStep("scan");
        setScanStep(getNextScanTypeForLine(line));
        setScanPayload("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to start picking.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setUiStep("scan");
    setScanStep(getNextScanTypeForLine(activeLine));
    setScanPayload("");
  }, [jobId, activeLine, job, warehouseId, pickerId, jobReadyForPack]);

  useEffect(() => {
    if (!job || !activeLine || initialStep !== "scan") {
      return;
    }
    if (jobComplete || jobReadyForPack || activeLine.has_pending_exception || uiStep !== "overview") {
      return;
    }
    beginScan();
  }, [job, activeLine, initialStep, uiStep, jobComplete, jobReadyForPack, beginScan]);

  const submitScan = useCallback(
    async (payload?: string) => {
      if (!job || !activeLine || !jobId) return;
      if (activeLine.has_pending_exception) {
        setError("This line is blocked pending supervisor review.");
        return;
      }
      const value = (payload ?? scanPayload).trim();
      if (!value) {
        setError("Enter or scan a barcode.");
        return;
      }

      const expectedStep = getNextScanTypeForLine(activeLine);
      const stepError = validateScanStep(activeLine, scanStep);
      if (stepError) {
        setScanStep(expectedStep);
        setError(stepError);
        return;
      }

      setIsLoading(true);
      setError(null);
      setScanSuccessMessage(null);
      try {
        const result = await pickerApi.submitPickScan({
          jobId,
          pickLineId: activeLine.id,
          pickerId,
          warehouseId,
          scanType: expectedStep,
          payload: value,
        });

        setJob(result.fulfillment_request);
        setScanPayload("");

        if (result.unit_picked) {
          setLastPickedUnitCode(result.unit_code);
          if (result.line_complete) {
            const completed = result.fulfillment_request.pick_lines.find(
              (line) => line.id === activeLine.id,
            );
            setConfirmedLine(completed ?? activeLine);
            setUiStep("confirmed");
            setScanSuccessMessage(null);
          } else {
            const refreshedLine = result.fulfillment_request.pick_lines.find(
              (line) => line.id === activeLine.id,
            );
            if (refreshedLine) {
              setScanStep(getNextScanTypeForLine(refreshedLine));
            }
            setScanSuccessMessage(
              formatScanSuccessMessage("unit", result.unit_code),
            );
          }
        } else {
          const refreshedLine = result.fulfillment_request.pick_lines.find(
            (line) => line.id === activeLine.id,
          );
          if (refreshedLine) {
            setScanStep(getNextScanTypeForLine(refreshedLine));
          }
          setScanSuccessMessage(formatScanSuccessMessage(expectedStep));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [job, activeLine, jobId, scanPayload, scanStep, pickerId, warehouseId],
  );

  const confirmNextItem = useCallback(async () => {
    if (!job || !jobId) return;

    if (isPickJobReadyForPack(job)) {
      setUiStep("overview");
      setLastPickedUnitCode(null);
      setConfirmedLine(null);
      setScanSuccessMessage(null);
      return;
    }

    await loadJob(jobId);
    setUiStep("overview");
    setLastPickedUnitCode(null);
    setConfirmedLine(null);
    setScanSuccessMessage(null);
  }, [job, jobId, loadJob]);

  const raiseShortPick = useCallback(
    async (params: {
      exceptionType: PickExceptionType;
      quantityFound?: number;
      notes?: string;
      photos?: PickExceptionPhotoDraft[];
    }) => {
      if (!activeLine || activeLine.has_pending_exception) return;
      setIsLoading(true);
      setError(null);
      setExceptionNotice(null);
      try {
        await pickerApi.raiseShortPick({
          pickLineId: activeLine.id,
          pickerId,
          exceptionType: params.exceptionType,
          quantityFound: params.quantityFound,
          notes: params.notes,
          photos: params.photos,
        });
        if (jobId) {
          await refreshJobDetail(jobId);
        }
        setUiStep("overview");
        setScanPayload("");
        setScanSuccessMessage(null);
        setExceptionNotice(
          `${formatPickExceptionLabel(params.exceptionType)} reported. Supervisor will review before picking continues on this line.`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to raise exception.");
      } finally {
        setIsLoading(false);
      }
    },
    [activeLine, pickerId, jobId, refreshJobDetail],
  );

  const clearExceptionNotice = useCallback(() => {
    setExceptionNotice(null);
  }, []);

  const resetToOverview = useCallback(() => {
    setUiStep("overview");
    setScanPayload("");
    setError(null);
    setConfirmedLine(null);
    setScanSuccessMessage(null);
    setExceptionNotice(null);
  }, []);

  const scanButtonTitle = useMemo(() => {
    if (!job) return "Start scanning";
    if (job.status === "reserved") return "Start picking";
    if (activeLine?.last_scan_type) return "Continue scanning";
    return "Start scanning";
  }, [job, activeLine]);

  const priorityJob = useMemo(
    () => selectPriorityPickJob(jobs, pickerId),
    [jobs, pickerId],
  );

  const secondaryJobs = useMemo(
    () => (priorityJob ? jobs.filter((entry) => entry.id !== priorityJob.id) : []),
    [jobs, priorityJob],
  );

  return {
    employee,
    jobs,
    stats,
    job,
    activeLine,
    jobComplete,
    jobReadyForPack,
    uiStep,
    scanStep,
    scanPayload,
    setScanPayload,
    lastPickedUnitCode,
    confirmedLine,
    scanSuccessMessage,
    exceptionNotice,
    isLoading,
    error,
    refreshJobs,
    loadJob,
    beginScan,
    submitScan,
    confirmNextItem,
    raiseShortPick,
    resetToOverview,
    nextScanType,
    scanButtonTitle,
    progressLabel,
    progressDoneLabel,
    currentItemIndex,
    totalItems,
    completedCount,
    unitProgressCurrent,
    unitProgressTotal,
    priorityJob,
    secondaryJobs,
  };
}
