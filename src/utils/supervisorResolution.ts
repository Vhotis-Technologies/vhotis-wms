import type {
  PickExceptionType,
  PickExceptionResolution,
  SupervisorExceptionResolution,
} from "@/interfaces/supervisor";

export interface ExceptionResolutionOption {
  resolution: SupervisorExceptionResolution;
  label: string;
  description: string;
  destructive?: boolean;
  requiresConfirm?: boolean;
  requiresNotes?: boolean;
  requiresRelocate?: boolean;
}

const RESOLUTION_CATALOG: Record<
  SupervisorExceptionResolution,
  Omit<ExceptionResolutionOption, "resolution">
> = {
  dismissed: {
    label: "Dismiss — picker error",
    description: "Picker can retry the line. No inventory change.",
    requiresConfirm: true,
  },
  partial_fulfil: {
    label: "Approve partial fulfil",
    description: "Accept found quantity and continue picking remaining units.",
  },
  cancel_line: {
    label: "Cancel pick line",
    description: "Remove this line from the job and release reserved stock.",
    destructive: true,
    requiresConfirm: true,
    requiresNotes: true,
  },
  recount_ordered: {
    label: "Order stock recount",
    description: "Mark line short and schedule an inventory recount at this location.",
    requiresNotes: true,
  },
  substitute_approved: {
    label: "Approve substitute",
    description: "Allow a substitute product path and mark the line short.",
    requiresNotes: true,
  },
  relocated: {
    label: "Relocate stock",
    description: "Scan or search an alternate pick location with available stock.",
    requiresRelocate: true,
    requiresConfirm: true,
  },
};

const RESOLUTIONS_BY_TYPE: Record<
  PickExceptionType,
  SupervisorExceptionResolution[]
> = {
  short_pick: [
    "relocated",
    "partial_fulfil",
    "recount_ordered",
    "cancel_line",
    "dismissed",
  ],
  location_empty: ["relocated", "recount_ordered", "cancel_line", "partial_fulfil"],
  wrong_product: [
    "substitute_approved",
    "recount_ordered",
    "cancel_line",
    "dismissed",
  ],
  damaged_stock: ["partial_fulfil", "recount_ordered", "cancel_line"],
  label_unreadable: ["dismissed", "recount_ordered", "cancel_line"],
  product_mismatch: [
    "substitute_approved",
    "recount_ordered",
    "cancel_line",
    "dismissed",
  ],
  other: [
    "relocated",
    "partial_fulfil",
    "recount_ordered",
    "cancel_line",
    "dismissed",
  ],
};

export function getResolutionOptionsForType(
  exceptionType: PickExceptionType,
): ExceptionResolutionOption[] {
  const keys = RESOLUTIONS_BY_TYPE[exceptionType] ?? RESOLUTIONS_BY_TYPE.other;

  return keys.map((resolution) => ({
    resolution,
    ...RESOLUTION_CATALOG[resolution],
  }));
}

export function resolutionSuccessFallback(
  resolution: SupervisorExceptionResolution,
): string {
  return RESOLUTION_CATALOG[resolution]?.description ?? "Exception resolved.";
}

export function formatExceptionResolutionLabel(
  resolution: PickExceptionResolution,
): string {
  if (resolution === "pending") {
    return "Pending review";
  }
  return (
    RESOLUTION_CATALOG[resolution as SupervisorExceptionResolution]?.label ??
    resolution.replaceAll("_", " ")
  );
}

export function validateResolutionSubmit(params: {
  option: ExceptionResolutionOption;
  notes: string;
  newLocationId?: number | null;
}): string | null {
  if (params.option.requiresRelocate && !params.newLocationId) {
    return "Select or scan an alternate location before relocating.";
  }
  if (params.option.requiresNotes && !params.notes.trim()) {
    return "Add supervisor notes before submitting this resolution.";
  }
  return null;
}
