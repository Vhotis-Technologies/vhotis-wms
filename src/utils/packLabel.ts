import type { PackJobDetail } from "@/interfaces/packer";

export function normalizeLabelPayload(payload: string): string {
  return payload.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export function labelPayloadMatchesJob(
  job: PackJobDetail,
  payload: string,
): boolean {
  const normalized = normalizeLabelPayload(payload);
  if (!normalized) {
    return false;
  }

  const candidates = [job.label.label_code, job.id, job.order_id];
  return candidates.some(
    (candidate) => normalizeLabelPayload(candidate) === normalized,
  );
}

export function validatePackLabelPayload(
  job: PackJobDetail,
  payload: string,
): string | null {
  const value = payload.trim();
  if (!value) {
    return "Scan the shipping label barcode.";
  }
  if (!job.label_printed) {
    return "Print the shipping label before scanning it.";
  }
  if (!labelPayloadMatchesJob(job, value)) {
    return `Label scan does not match ${job.label.label_code}.`;
  }
  return null;
}

export function getPackLabelScanPrompt(job: PackJobDetail): string {
  return `Scan shipping label · ${job.label.label_code.replace(/-/g, " · ")}`;
}

export function getPackLabelScanDetail(job: PackJobDetail): string {
  return `Expected barcode for order ${job.order_id}`;
}

export function formatPackLabelLinkSuccess(job: PackJobDetail): string {
  return `Label linked · ${job.order_id} ready to seal.`;
}

export function formatPackLabelPrintSuccess(reprint = false): string {
  return reprint
    ? "Label sent to printer again — scan the new barcode."
    : "Label sent to printer — scan the barcode on the label.";
}
