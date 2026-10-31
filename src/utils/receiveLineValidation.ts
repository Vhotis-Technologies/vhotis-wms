import type { PackagingMode } from "@/interfaces/sorter";

export interface ReceiveLineInput {
  receivedQuantity: number;
  damagedQuantity: number;
  packagingMode: PackagingMode;
  cartonCount?: number;
  unitsPerCarton?: number;
}

export function computeAcceptedQuantity(
  receivedQuantity: number,
  damagedQuantity: number,
): number {
  return Math.max(receivedQuantity - damagedQuantity, 0);
}

export function formatQuantityVariance(
  receivedQuantity: number,
  declaredQuantity: number,
): string | null {
  if (receivedQuantity === declaredQuantity) {
    return null;
  }
  const diff = receivedQuantity - declaredQuantity;
  if (diff > 0) {
    return `+${diff} vs declared ${declaredQuantity}`;
  }
  return `${diff} vs declared ${declaredQuantity}`;
}

export function validateReceiveLineInput(values: ReceiveLineInput): string | null {
  if (!Number.isFinite(values.receivedQuantity) || values.receivedQuantity < 1) {
    return "Received quantity must be at least 1.";
  }
  if (!Number.isFinite(values.damagedQuantity) || values.damagedQuantity < 0) {
    return "Damaged quantity cannot be negative.";
  }
  if (values.damagedQuantity > values.receivedQuantity) {
    return "Damaged quantity cannot exceed received quantity.";
  }

  const accepted = computeAcceptedQuantity(
    values.receivedQuantity,
    values.damagedQuantity,
  );

  if (values.packagingMode === "boxed") {
    if (values.cartonCount == null || values.unitsPerCarton == null) {
      return "Boxed mode requires carton count and units per carton.";
    }
    if (
      !Number.isInteger(values.cartonCount) ||
      !Number.isInteger(values.unitsPerCarton) ||
      values.cartonCount < 1 ||
      values.unitsPerCarton < 1
    ) {
      return "Carton count and units per carton must be whole numbers of at least 1.";
    }
    const packedTotal = values.cartonCount * values.unitsPerCarton;
    if (packedTotal !== accepted) {
      return `Cartons × units (${values.cartonCount} × ${values.unitsPerCarton} = ${packedTotal}) must equal accepted quantity (${accepted}).`;
    }
  }

  return null;
}

export function receiveLineWarning(values: ReceiveLineInput): string | null {
  const accepted = computeAcceptedQuantity(
    values.receivedQuantity,
    values.damagedQuantity,
  );
  if (accepted === 0 && values.damagedQuantity > 0) {
    return "All units are damaged. This line will be recorded with zero accepted stock.";
  }
  return null;
}
