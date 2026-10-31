import type { PickJobDetail, PickLine, PickScanType } from "@/interfaces/picker";
import { getNextScanTypeForLine } from "@/utils/pickerScan";

export function isPickJobFullyPicked(job: PickJobDetail): boolean {
  if (job.pick_lines.length === 0) {
    return false;
  }
  return job.pick_lines.every(
    (line) => line.quantity_picked >= line.quantity_required,
  );
}

/** True when no pick lines remain in floor-pending state (matches pack queue rules). */
export function isPickJobReadyForPack(job: PickJobDetail): boolean {
  if (job.pick_lines.length === 0) {
    return false;
  }
  if (job.pick_lines.some((line) => line.has_pending_exception)) {
    return false;
  }
  return job.pick_lines.every((line) => line.line_status !== "pending");
}

/** @deprecated Use isPickJobFullyPicked or isPickJobReadyForPack explicitly. */
export function isPickJobComplete(job: PickJobDetail): boolean {
  return isPickJobFullyPicked(job);
}

export function countRemainingPickLines(job: PickJobDetail): number {
  return job.pick_lines.filter(
    (line) => line.line_status === "pending" && !line.has_pending_exception,
  ).length;
}

export function getPickHandoffMessage(job: PickJobDetail): string {
  if (isPickJobFullyPicked(job)) {
    return `All lines picked for ${job.order_id}. Hand off to the pack station.`;
  }

  const shortLines = job.pick_lines.filter((line) => line.line_status === "short");
  const cancelledLines = job.pick_lines.filter(
    (line) => line.line_status === "cancelled",
  );
  const adjusted = shortLines.length + cancelledLines.length;

  if (adjusted > 0) {
    return `Pick floor work is complete for ${job.order_id} (${adjusted} line${
      adjusted === 1 ? "" : "s"
    } short or cancelled after supervisor review). Hand off to pack.`;
  }

  return `Pick work is complete for ${job.order_id}. Hand off to the pack station.`;
}

export function pickJobProgress(job: PickJobDetail) {
  const total = job.pick_lines.length;
  const readyForPack = isPickJobReadyForPack(job);
  const linesComplete = job.pick_lines.filter(
    (line) =>
      line.line_status !== "pending" ||
      line.quantity_picked >= line.quantity_required,
  ).length;
  const linesBlocked = job.pick_lines.filter(
    (line) => line.has_pending_exception,
  ).length;
  const unitsRequired = job.pick_lines.reduce(
    (sum, line) => sum + line.quantity_required,
    0,
  );
  const unitsPicked = job.pick_lines.reduce(
    (sum, line) => sum + line.quantity_picked,
    0,
  );

  return {
    total,
    linesComplete,
    linesBlocked,
    unitsRequired,
    unitsPicked,
    readyForPack,
  };
}

export function allOpenLinesBlocked(job: PickJobDetail): boolean {
  const openLines = job.pick_lines.filter(
    (line) => line.quantity_picked < line.quantity_required,
  );
  if (openLines.length === 0) {
    return false;
  }
  return openLines.every((line) => line.has_pending_exception);
}

export function formatNextScanHint(line: PickLine): string {
  const step = getNextScanTypeForLine(line);
  switch (step) {
    case "location":
      return line.location_code
        ? `Next: scan location ${line.location_code}`
        : "Next: scan location barcode";
    case "container":
      return line.expected_container_code
        ? `Next: scan container ${line.expected_container_code}`
        : "Next: scan container barcode";
    case "unit":
      return line.quantity_required > 1
        ? `Next: scan unit (${line.quantity_picked}/${line.quantity_required} picked)`
        : "Next: scan unit barcode";
    default:
      return "Ready to scan";
  }
}

export function formatScanStepLabel(step: PickScanType): string {
  switch (step) {
    case "location":
      return "Location scan";
    case "container":
      return "Container scan";
    case "unit":
      return "Unit scan";
    default:
      return "Scan";
  }
}
