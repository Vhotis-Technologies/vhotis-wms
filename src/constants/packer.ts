import type { WarehouseEmployee } from "@/interfaces/auth";
import type { PackJobDetail, PackJobStatus, PackJobSummary } from "@/interfaces/packer";

export const DEFAULT_PACK_STATION_LABEL = "Pack station";

export const PACK_QUEUE_STATUSES = ["ready", "packing", "packed"] as const;

export function formatPackerShiftLabel(employee?: WarehouseEmployee | null): string {
  const warehouseCode = employee?.warehouse_code;
  const workArea = employee?.active_shift?.work_area;

  if (workArea === "pack" && warehouseCode) {
    return `On shift · Pack · ${warehouseCode}`;
  }
  if (warehouseCode) {
    return `Pack floor · ${warehouseCode}`;
  }
  return "Pack floor";
}

export function formatPackJobStatus(status: PackJobStatus): string {
  switch (status) {
    case "packing":
      return "In progress";
    case "packed":
      return "Awaiting dispatch";
    case "ready_for_dispatch":
      return "Ready for dispatch";
    default:
      return "Ready to pack";
  }
}

export function packJobHubSubtitle(job: PackJobSummary): string {
  return `${job.store_name} · ${formatPackJobStatus(job.status)} · ${job.order_id}`;
}

export function packJobPrimaryActionLabel(job: PackJobSummary): string {
  if (job.status === "packed") {
    return `Send to dispatch · ${job.order_id}`;
  }
  if (job.status === "packing") {
    return `Continue packing · ${job.order_id}`;
  }
  return `Start packing · ${job.order_id}`;
}

export function packJobOpenHref(job: PackJobSummary): string {
  if (job.status === "packing") {
    return `/main/packer/${job.id}?step=verify`;
  }
  if (job.status === "packed") {
    return `/main/packer/${job.id}?step=dispatch`;
  }
  return `/main/packer/${job.id}`;
}

export function packOverviewButtonTitle(job: PackJobDetail): string {
  if (job.status === "ready") {
    return "Start packing";
  }
  if (job.status === "packed" && job.label_linked) {
    return "Send to dispatch bay";
  }
  if (job.status === "packed" || job.label_printed) {
    return "Continue to label scan";
  }
  if (job.units_required > 0 && job.units_verified >= job.units_required) {
    return "Print label";
  }
  return "Continue verification";
}

export function selectPriorityPackJob(
  jobs: PackJobSummary[],
  packerEmployeeId?: number,
): PackJobSummary | null {
  if (jobs.length === 0) {
    return null;
  }

  if (packerEmployeeId) {
    const assignedToMe = jobs.find(
      (job) =>
        (job.status === "packing" || job.status === "packed") &&
        job.assigned_packer_id === packerEmployeeId,
    );
    if (assignedToMe) {
      return assignedToMe;
    }
  }

  const inProgress = jobs.find((job) => job.status === "packing");
  if (inProgress) {
    return inProgress;
  }

  const packedAwaitingLabel = jobs.find((job) => job.status === "packed");
  if (packedAwaitingLabel) {
    return packedAwaitingLabel;
  }

  return jobs[0];
}
