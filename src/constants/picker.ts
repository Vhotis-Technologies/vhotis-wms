import type { WarehouseEmployee } from "@/interfaces/auth";
import type { PickExceptionType, PickJobSummary } from "@/interfaces/picker";

export const PICK_EXCEPTION_OPTIONS: {
  type: PickExceptionType;
  label: string;
}[] = [
  { type: "short_pick", label: "Short pick — insufficient quantity" },
  { type: "location_empty", label: "Location empty — nothing at bin" },
  { type: "wrong_product", label: "Wrong product — label mismatch" },
  { type: "damaged_stock", label: "Damaged stock — found at location" },
  { type: "label_unreadable", label: "Label unreadable — cannot scan" },
  { type: "product_mismatch", label: "Product mismatch — wrong item" },
  { type: "other", label: "Other" },
];

export function formatPickExceptionLabel(type: PickExceptionType): string {
  return (
    PICK_EXCEPTION_OPTIONS.find((option) => option.type === type)?.label ??
    "Pick exception"
  );
}

export function pickExceptionUsesQuantity(type: PickExceptionType): boolean {
  return type === "short_pick" || type === "location_empty";
}

/** Fulfillment request statuses shown on the picker queue. */
export const PICK_QUEUE_STATUSES = ["reserved", "picking"] as const;

export function formatPickerShiftLabel(employee?: WarehouseEmployee | null): string {
  const warehouseCode = employee?.warehouse_code;
  const workArea = employee?.active_shift?.work_area;

  if (workArea === "pick" && warehouseCode) {
    return `On shift · Pick · ${warehouseCode}`;
  }
  if (warehouseCode) {
    return `Pick floor · ${warehouseCode}`;
  }
  return "Pick floor";
}

export function formatPickJobStatus(status: PickJobSummary["status"]): string {
  return status === "picking" ? "In progress" : "Reserved";
}

export function pickJobHubSubtitle(job: PickJobSummary): string {
  return `${job.store_name} · ${formatPickJobStatus(job.status)} · ${job.id}`;
}

export function selectPriorityPickJob(
  jobs: PickJobSummary[],
  pickerEmployeeId?: number,
): PickJobSummary | null {
  if (jobs.length === 0) {
    return null;
  }

  if (pickerEmployeeId) {
    const assignedToMe = jobs.find(
      (job) =>
        job.status === "picking" && job.assigned_picker_id === pickerEmployeeId,
    );
    if (assignedToMe) {
      return { ...assignedToMe, priority: true };
    }
  }

  const inProgress = jobs.find((job) => job.status === "picking");
  if (inProgress) {
    return { ...inProgress, priority: true };
  }

  return { ...jobs[0], priority: true };
}

export function pickJobPrimaryActionLabel(job: PickJobSummary): string {
  if (job.status === "picking") {
    return `Continue picking · ${job.order_id}`;
  }
  return `Start picking · ${job.order_id}`;
}

export function pickJobOpenHref(job: PickJobSummary): string {
  if (job.status === "picking") {
    return `/main/picker/${job.id}?step=scan`;
  }
  return `/main/picker/${job.id}`;
}
