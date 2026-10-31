import { useCallback, useEffect, useMemo, useState } from "react";

import { packOverviewButtonTitle, selectPriorityPackJob } from "@/constants/packer";
import type {
  PackJobDetail,
  PackJobSummary,
  PackerDashboardStats,
  PackUiStep,
} from "@/interfaces/packer";
import { useAuthStore } from "@/store";
import * as packerApi from "@/store/api/packerApi";
import * as packJobUtil from "@/utils/packJob";
import * as packLabelUtil from "@/utils/packLabel";
import * as packScanUtil from "@/utils/packScan";

interface UsePackerOptions {
  jobId?: string;
  initialStep?: PackUiStep;
}

function clearScanFeedback(
  setScanPayload: (value: string) => void,
  setScanSuccessMessage: (value: string | null) => void,
  setLastVerifiedUnitCode: (value: string | null) => void,
) {
  setScanPayload("");
  setScanSuccessMessage(null);
  setLastVerifiedUnitCode(null);
}

export function usePacker(options: UsePackerOptions = {}) {
  const { jobId, initialStep } = options;
  const employee = useAuthStore((state) => state.employee);
  const warehouseId = employee?.warehouse ?? 0;
  const packerId = employee?.id ?? 0;

  const [jobs, setJobs] = useState<PackJobSummary[]>([]);
  const [stats, setStats] = useState<PackerDashboardStats | null>(null);
  const [job, setJob] = useState<PackJobDetail | null>(null);
  const [uiStep, setUiStep] = useState<PackUiStep>("overview");
  const [scanPayload, setScanPayload] = useState("");
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [lastVerifiedUnitCode, setLastVerifiedUnitCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshJobs = useCallback(async () => {
    if (!warehouseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [jobList, dashboardStats] = await Promise.all([
        packerApi.listPackJobs(warehouseId),
        packerApi.getPackerStats(warehouseId, packerId),
      ]);
      setJobs(jobList);
      setStats(dashboardStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pack jobs.");
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId, packerId]);

  const loadJob = useCallback(
    async (targetJobId: string) => {
      if (!warehouseId) return;
      setIsLoading(true);
      setError(null);
      try {
        const detail = await packerApi.getPackJob(warehouseId, targetJobId);
        setJob(detail);
        setUiStep(packJobUtil.resolvePackEntryStep(detail, initialStep));
        clearScanFeedback(setScanPayload, setScanSuccessMessage, setLastVerifiedUnitCode);
      } catch (err) {
        setJob(null);
        setError(err instanceof Error ? err.message : "Unable to load pack job.");
      } finally {
        setIsLoading(false);
      }
    },
    [warehouseId, initialStep],
  );

  const refreshJobDetail = useCallback(
    async (targetJobId: string) => {
      if (!warehouseId) return null;
      setIsRefreshing(true);
      setError(null);
      try {
        const detail = await packerApi.getPackJob(warehouseId, targetJobId);
        setJob(detail);
        return detail;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to refresh pack job.");
        return null;
      } finally {
        setIsRefreshing(false);
      }
    },
    [warehouseId],
  );

  const startPackSession = useCallback(async () => {
    if (!jobId || !warehouseId || !job) return job;
    if (job.status !== "ready") return job;

    setIsLoading(true);
    setError(null);
    try {
      const updated = await packerApi.startPack(warehouseId, jobId, packerId);
      setJob(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start packing.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [jobId, warehouseId, packerId, job]);

  useEffect(() => {
    if (!jobId) {
      void refreshJobs();
    }
  }, [jobId, refreshJobs]);

  useEffect(() => {
    if (jobId) {
      void loadJob(jobId);
      return;
    }

    setJob(null);
    setUiStep("overview");
    clearScanFeedback(setScanPayload, setScanSuccessMessage, setLastVerifiedUnitCode);
    setError(null);
  }, [jobId, loadJob]);

  const verifiedCount = job?.units_verified ?? 0;
  const totalUnits = job?.units_required ?? 0;
  const linesVerified = useMemo(() => {
    if (!job) return 0;
    return job.pack_lines.filter((line) => line.status === "verified").length;
  }, [job]);
  const totalLines = job?.pack_lines.length ?? 0;
  const packComplete = verifiedCount >= totalUnits && totalUnits > 0;

  const activeLine = useMemo(
    () => (job ? packScanUtil.getActivePackLine(job.pack_lines) : null),
    [job],
  );

  const beginVerification = useCallback(async () => {
    if (!job) return;

    setError(null);

    let current = job;
    if (job.status === "ready") {
      const updated = await startPackSession();
      if (!updated) return;
      current = updated;
    }

    if (packJobUtil.isPackVerificationComplete(current)) {
      setUiStep(current.label_printed ? "labelScan" : "labelReady");
      setScanPayload("");
      return;
    }

    if (current.status === "packed" || current.label_printed) {
      setUiStep("labelScan");
      setScanPayload("");
      return;
    }

    setUiStep("verify");
    clearScanFeedback(setScanPayload, setScanSuccessMessage, setLastVerifiedUnitCode);
  }, [job, startPackSession]);

  useEffect(() => {
    if (!job || initialStep !== "verify" || uiStep !== "verify") return;
    if (packJobUtil.isPackVerificationComplete(job)) {
      setUiStep(job.label_printed ? "labelScan" : "labelReady");
      return;
    }
    if (job.status === "ready") {
      void beginVerification();
    }
  }, [job, initialStep, uiStep, beginVerification]);

  const submitUnitScan = useCallback(
    async (payload?: string) => {
      if (!job || !jobId) return;

      const value = (payload ?? scanPayload).trim();
      if (!value) {
        setError("Enter or scan a unit barcode.");
        setScanSuccessMessage(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setScanSuccessMessage(null);

      try {
        let currentJob = job;
        if (job.status === "ready") {
          const updated = await startPackSession();
          if (!updated) return;
          currentJob = updated;
        }

        const validationError = packScanUtil.validatePackUnitPayload(value, currentJob);
        if (validationError) {
          setError(validationError);
          return;
        }

        const activeLineBefore = packScanUtil.getActivePackLine(currentJob.pack_lines);
        const result = await packerApi.submitPackScan({
          jobId,
          packerId,
          warehouseId,
          payload: value,
        });

        const completedLine = activeLineBefore
          ? result.job.pack_lines.find((line) => line.id === activeLineBefore.id) ?? null
          : result.job.pack_lines.find((line) =>
              line.verified_unit_codes.includes(result.unit_code),
            ) ?? null;

        setJob(result.job);
        setScanPayload("");
        setLastVerifiedUnitCode(result.unit_code);
        setScanSuccessMessage(
          packScanUtil.formatPackScanSuccessMessage(result.unit_code, completedLine),
        );

        if (result.pack_complete) {
          setUiStep("labelReady");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [job, jobId, scanPayload, packerId, warehouseId, startPackSession],
  );

  const printLabel = useCallback(
    async (reprint = false) => {
      if (!jobId || !warehouseId) return;
      setIsLoading(true);
      setError(null);
      setScanSuccessMessage(null);
      try {
        const updated = await packerApi.printPackLabel(warehouseId, jobId, packerId, {
          reprint,
        });
        setJob(updated);
        setScanSuccessMessage(packLabelUtil.formatPackLabelPrintSuccess(reprint));
        setUiStep("labelScan");
        setScanPayload("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to print label.");
      } finally {
        setIsLoading(false);
      }
    },
    [jobId, warehouseId, packerId],
  );

  const handleOverviewAction = useCallback(async () => {
    if (!job) return;

    if (packJobUtil.isPackJobReadyForRiderHandoff(job)) {
      setUiStep("dispatch");
      setError(null);
      return;
    }

    if (packJobUtil.isPackVerificationComplete(job) || job.status === "packed") {
      if (job.label_printed) {
        setUiStep("labelScan");
        clearScanFeedback(setScanPayload, setScanSuccessMessage, setLastVerifiedUnitCode);
        return;
      }
      await printLabel();
      return;
    }

    await beginVerification();
  }, [job, beginVerification, printLabel]);

  const submitLabelScan = useCallback(
    async (payload?: string) => {
      if (!jobId || !warehouseId || !job) return;

      const value = (payload ?? scanPayload).trim();
      if (!value) {
        setError("Scan the shipping label barcode.");
        setScanSuccessMessage(null);
        return;
      }

      const validationError = packLabelUtil.validatePackLabelPayload(job, value);
      if (validationError) {
        setError(validationError);
        setScanSuccessMessage(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setScanSuccessMessage(null);
      try {
        await packerApi.linkPackLabel(warehouseId, {
          jobId,
          packerId,
          payload: value,
        });
        const updated = await packerApi.completePack(warehouseId, jobId, packerId);
        setJob(updated);
        setScanPayload("");
        setScanSuccessMessage(packLabelUtil.formatPackLabelLinkSuccess(updated));
        setUiStep("dispatch");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Label scan failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [jobId, job, scanPayload, packerId, warehouseId],
  );

  const sendToDispatch = useCallback(async () => {
    if (!jobId || !warehouseId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const result = await packerApi.handOffToRider(warehouseId, jobId);
      setJob(null);
      setUiStep("overview");
      clearScanFeedback(setScanPayload, setScanSuccessMessage, setLastVerifiedUnitCode);
      await refreshJobs();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send to dispatch.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [jobId, warehouseId, refreshJobs]);

  const reprintLabel = useCallback(async () => {
    await printLabel(true);
  }, [printLabel]);

  const continueToLabelScan = useCallback(() => {
    setUiStep("labelScan");
    setScanPayload("");
    setError(null);
  }, []);

  const updateScanPayload = useCallback((value: string) => {
    setScanPayload(value);
    setScanSuccessMessage(null);
    setError(null);
  }, []);

  const resetToOverview = useCallback(() => {
    setUiStep("overview");
    clearScanFeedback(setScanPayload, setScanSuccessMessage, setLastVerifiedUnitCode);
    setError(null);
  }, []);

  const packButtonTitle = useMemo(
    () => (job ? packOverviewButtonTitle(job) : "Start packing"),
    [job],
  );

  const progressLabel = useMemo(() => {
    if (!job) return "";
    const progress = packJobUtil.packJobProgress(job);
    return `${progress.unitsVerified}/${progress.unitsRequired} units verified`;
  }, [job]);

  const scanPrompt = useMemo(
    () =>
      job ? packScanUtil.getPackScanPrompt(activeLine, job) : "Scan unit barcode",
    [job, activeLine],
  );

  const scanDetail = useMemo(
    () => (job ? packScanUtil.getPackScanDetail(activeLine, job) : progressLabel),
    [job, activeLine, progressLabel],
  );

  const scanButtonTitle = useMemo(() => {
    if (!activeLine) return "Confirm scan";
    const remaining = activeLine.quantity_required - activeLine.quantity_verified;
    return remaining > 1 ? "Verify unit" : "Verify last unit";
  }, [activeLine]);

  const labelScanPrompt = useMemo(
    () =>
      job
        ? packLabelUtil.getPackLabelScanPrompt(job)
        : "Scan shipping label barcode",
    [job],
  );

  const labelScanDetail = useMemo(
    () => (job ? packLabelUtil.getPackLabelScanDetail(job) : undefined),
    [job],
  );

  const priorityJob = useMemo(
    () => selectPriorityPackJob(jobs, packerId),
    [jobs, packerId],
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
    uiStep,
    scanPayload,
    setScanPayload: updateScanPayload,
    scanSuccessMessage,
    lastVerifiedUnitCode,
    isLoading: isLoading || isRefreshing,
    error,
    refreshJobs,
    loadJob,
    refreshJobDetail,
    startPackSession,
    beginVerification,
    handleOverviewAction,
    submitUnitScan,
    printLabel,
    continueToLabelScan,
    submitLabelScan,
    sendToDispatch,
    reprintLabel,
    resetToOverview,
    verifiedCount,
    totalUnits,
    linesVerified,
    totalLines,
    packComplete,
    packButtonTitle,
    progressLabel,
    scanPrompt,
    scanDetail,
    scanButtonTitle,
    labelScanPrompt,
    labelScanDetail,
    priorityJob,
    secondaryJobs,
  };
}
