import type { PackJobDetail, PackJobSummary, PackUiStep } from "@/interfaces/packer";

export function isPackVerificationComplete(job: PackJobDetail): boolean {
  if (job.units_required <= 0) {
    return false;
  }
  return job.units_verified >= job.units_required;
}

export function isPackJobReadyForDispatch(job: PackJobDetail): boolean {
  return job.status === "packed" || job.status === "ready_for_dispatch";
}

export function packJobProgress(job: PackJobDetail) {
  return {
    unitsVerified: job.units_verified,
    unitsRequired: job.units_required,
    linesVerified: job.pack_lines.filter((line) => line.status === "verified")
      .length,
    totalLines: job.pack_lines.length,
    verificationComplete: isPackVerificationComplete(job),
  };
}

export function shouldIncludeInPackQueue(job: PackJobDetail): boolean {
  return job.status !== "ready_for_dispatch";
}

export function isPackJobReadyForRiderHandoff(job: PackJobDetail): boolean {
  return (
    job.status === "packed" &&
    job.label_linked &&
    isPackVerificationComplete(job)
  );
}

export function getPackDispatchMessage(job: PackJobDetail): string {
  return `Order ${job.order_id} is sealed and labelled. Move the carton to the dispatch bay for rider pickup.`;
}

export function getPackDispatchDetail(job: PackJobDetail): string {
  const progress = packJobProgress(job);
  return `${progress.unitsVerified} units verified · ${job.store_name} · ${job.box_hint}`;
}

export function filterPackQueueJobs(jobs: PackJobSummary[]): PackJobSummary[] {
  return jobs.filter((job) => job.status !== "ready_for_dispatch");
}

/** Map hub deep-link step + job state to the screen the packer should land on. */
export function resolvePackEntryStep(
  job: PackJobDetail,
  requestedStep?: PackUiStep,
): PackUiStep {
  if (
    isPackJobReadyForRiderHandoff(job) ||
    job.status === "ready_for_dispatch"
  ) {
    return "dispatch";
  }

  if (requestedStep === "dispatch") {
    if (job.label_printed && !job.label_linked) {
      return "labelScan";
    }
    if (isPackVerificationComplete(job) && !job.label_printed) {
      return "labelReady";
    }
    if (!isPackVerificationComplete(job)) {
      return job.status === "ready" ? "overview" : "verify";
    }
    return "dispatch";
  }

  if (requestedStep === "labelReady") {
    if (isPackVerificationComplete(job)) {
      return job.label_printed ? "labelScan" : "labelReady";
    }
    return job.status === "ready" ? "overview" : "verify";
  }

  if (requestedStep === "verify") {
    if (isPackVerificationComplete(job)) {
      return job.label_printed ? "labelScan" : "labelReady";
    }
    return "verify";
  }

  return "overview";
}
