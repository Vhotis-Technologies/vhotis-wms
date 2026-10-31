import type { PickLine, PickScanType } from "@/interfaces/picker";

export function getNextScanTypeForLine(line: PickLine): PickScanType {
  if (!line.last_scan_type) {
    return "location";
  }
  if (line.last_scan_type === "location") {
    return line.requires_container ? "container" : "unit";
  }
  if (line.last_scan_type === "container") {
    return "unit";
  }
  if (line.quantity_picked < line.quantity_required) {
    return line.requires_container ? "container" : "location";
  }
  return "unit";
}

export function validateScanStep(
  line: PickLine,
  scanType: PickScanType,
): string | null {
  const expected = getNextScanTypeForLine(line);
  if (scanType !== expected) {
    return `Expected ${expected} scan, not ${scanType}.`;
  }
  return null;
}

export function getNextReservedUnitCode(line: PickLine): string | null {
  if (line.reserved_unit_codes.length === 0) {
    return null;
  }
  const index = Math.min(line.quantity_picked, line.reserved_unit_codes.length - 1);
  return line.reserved_unit_codes[index] ?? null;
}

export function getScanPromptForStep(
  line: PickLine,
  step: PickScanType,
): string {
  switch (step) {
    case "location":
      return line.location_code
        ? `Scan location ${line.location_code}`
        : "Scan location barcode";
    case "container":
      return line.expected_container_code
        ? `Scan container ${line.expected_container_code}`
        : "Scan container / carton barcode";
    case "unit":
      return "Scan unit barcode";
    default:
      return "Scan barcode";
  }
}

export function getScanDetailForStep(
  line: PickLine,
  step: PickScanType,
): string | undefined {
  switch (step) {
    case "location":
      return line.location_detail || undefined;
    case "container":
      return line.requires_container
        ? `${line.quantity_picked}/${line.quantity_required} units in carton`
        : undefined;
    case "unit": {
      const nextUnit = getNextReservedUnitCode(line);
      if (nextUnit) {
        return `Expected: ${nextUnit} · ${line.quantity_picked + 1}/${line.quantity_required}`;
      }
      return `${line.quantity_picked + 1} of ${line.quantity_required} units`;
    }
    default:
      return undefined;
  }
}

export function formatScanSuccessMessage(
  scanType: PickScanType,
  unitCode?: string | null,
): string {
  switch (scanType) {
    case "location":
      return "Location confirmed — continue scanning.";
    case "container":
      return "Container confirmed — scan unit barcode next.";
    case "unit":
      return unitCode ? `Unit ${unitCode} picked.` : "Unit picked.";
    default:
      return "Scan confirmed.";
  }
}

export function syncPickLineStatuses(lines: PickLine[]): PickLine[] {
  let activeAssigned = false;

  return lines.map((line) => {
    if (line.has_pending_exception) {
      return { ...line, status: "blocked" };
    }
    if (
      line.line_status !== "pending" ||
      line.quantity_picked >= line.quantity_required
    ) {
      return { ...line, status: "completed" };
    }
    if (!activeAssigned) {
      activeAssigned = true;
      return { ...line, status: "active" };
    }
    return { ...line, status: "pending" };
  });
}
