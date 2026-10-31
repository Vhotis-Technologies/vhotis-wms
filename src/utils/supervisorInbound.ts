import type {
  SupervisorInboundApprovalSummary,
  SupervisorInboundReceiptLineStatus,
  SupervisorInboundVarianceLine,
  SupervisorInboundVarianceResolution,
} from "@/interfaces/supervisor";

export interface InboundVarianceResolutionOption {
  resolution: SupervisorInboundVarianceResolution;
  label: string;
  description: string;
  destructive?: boolean;
  requiresConfirm?: boolean;
  requiresNotes?: boolean;
}

export const INBOUND_VARIANCE_RESOLUTION_OPTIONS: InboundVarianceResolutionOption[] =
  [
    {
      resolution: "accept_variance",
      label: "Accept variance",
      description:
        "Confirm the received quantity and let stock finalize for this line.",
    },
    {
      resolution: "reject_line",
      label: "Reject line",
      description: "Mark the receipt line rejected and keep stock off the floor.",
      destructive: true,
      requiresConfirm: true,
    },
    {
      resolution: "recount_ordered",
      label: "Order recount",
      description: "Send the line back to dock staff for a fresh count.",
      requiresNotes: true,
    },
  ];

export function getInboundResolutionOptions(
  line: SupervisorInboundVarianceLine,
): InboundVarianceResolutionOption[] {
  if (!line.needsApproval) {
    return [];
  }
  return INBOUND_VARIANCE_RESOLUTION_OPTIONS;
}

export function validateInboundResolutionSubmit(params: {
  option: InboundVarianceResolutionOption;
  notes: string;
}): string | null {
  if (params.option.requiresNotes && !params.notes.trim()) {
    return "Add supervisor notes before ordering a recount.";
  }
  return null;
}

export function formatInboundReceiptLineStatus(
  status: SupervisorInboundReceiptLineStatus,
): string {
  switch (status) {
    case "pending":
      return "Pending count";
    case "accepted":
      return "Accepted";
    case "partial":
      return "Partial";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export function formatInboundDeliveryMethod(method: string): string {
  return method === "seller_delivery" ? "Seller delivery" : "Vhotis collection";
}

export function sortInboundApprovals(
  approvals: SupervisorInboundApprovalSummary[],
): SupervisorInboundApprovalSummary[] {
  return [...approvals].sort((left, right) => {
    if (left.pendingVarianceCount !== right.pendingVarianceCount) {
      return right.pendingVarianceCount - left.pendingVarianceCount;
    }
    if (left.needsSignOff !== right.needsSignOff) {
      return left.needsSignOff ? -1 : 1;
    }
    return left.id.localeCompare(right.id);
  });
}

export function inboundApprovalSubtitle(
  approval: SupervisorInboundApprovalSummary,
): string {
  const varianceLabel =
    approval.pendingVarianceCount > 0
      ? `${approval.pendingVarianceCount} pending variance${
          approval.pendingVarianceCount === 1 ? "" : "s"
        }`
      : approval.varianceLineCount > 0
        ? `${approval.varianceLineCount} variance line${
            approval.varianceLineCount === 1 ? "" : "s"
          }`
        : "Ready for sign-off";

  return `${formatInboundDeliveryMethod(approval.deliveryMethod)} · ${varianceLabel}`;
}
