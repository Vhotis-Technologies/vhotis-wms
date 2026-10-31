import type { PackJobDetail, PackLine } from "@/interfaces/packer";

export function syncPackLineStatuses(lines: PackLine[]): PackLine[] {
  let activeAssigned = false;

  return lines.map((line) => {
    if (
      line.quantity_required > 0 &&
      line.quantity_verified >= line.quantity_required
    ) {
      return { ...line, status: "verified" };
    }
    if (line.quantity_required === 0) {
      return { ...line, status: "verified" };
    }
    if (!activeAssigned) {
      activeAssigned = true;
      return { ...line, status: "active" };
    }
    return { ...line, status: "pending" };
  });
}

export function getActivePackLine(lines: PackLine[]): PackLine | null {
  return lines.find((line) => line.status === "active") ?? null;
}

export function getNextUnverifiedUnitCode(line: PackLine): string | null {
  const verified = new Set(line.verified_unit_codes);
  return line.unit_codes.find((code) => !verified.has(code)) ?? null;
}

export function getPackScanPrompt(
  line: PackLine | null,
  job: PackJobDetail,
): string {
  if (!line) {
    return job.units_required > 0
      ? `Scan unit barcode (${job.units_verified} of ${job.units_required} done)`
      : "Scan unit barcode";
  }

  const nextUnit = getNextUnverifiedUnitCode(line);
  if (nextUnit) {
    return `Scan unit ${nextUnit}`;
  }

  return `Scan unit for ${line.product_name}`;
}

export function getPackScanDetail(
  line: PackLine | null,
  job: PackJobDetail,
): string {
  if (!line) {
    return `${job.units_verified}/${job.units_required} units verified`;
  }

  const nextUnit = getNextUnverifiedUnitCode(line);
  const lineProgress = `${line.quantity_verified + 1}/${line.quantity_required}`;

  if (nextUnit) {
    return `${line.location_code} · Expected ${nextUnit} · ${lineProgress} on this line`;
  }

  return `${line.location_code} · ${line.quantity_verified}/${line.quantity_required} on this line`;
}

export function formatPackScanSuccessMessage(
  unitCode: string,
  line?: PackLine | null,
): string {
  if (line && line.quantity_verified >= line.quantity_required) {
    return `Unit ${unitCode} verified · ${line.product_name} complete.`;
  }
  return `Unit ${unitCode} verified.`;
}

export function validatePackUnitPayload(
  payload: string,
  job: PackJobDetail,
): string | null {
  const value = payload.trim();
  if (!value) {
    return "Enter or scan a unit barcode.";
  }

  const verifiedCodes = new Set(
    job.pack_lines.flatMap((line) => line.verified_unit_codes),
  );

  if (verifiedCodes.has(value)) {
    return `Unit ${value} was already scanned at pack.`;
  }

  return null;
}
