import type {
  SupervisorDamageClaimTask,
  SupervisorDamageLiability,
  SupervisorDamageType,
  SupervisorRecountTask,
} from "@/interfaces/supervisor";

export type InventoryTaskFilter = "all" | "recount" | "damage";

export const INVENTORY_TASK_FILTERS: {
  id: InventoryTaskFilter;
  label: string;
}[] = [
  { id: "all", label: "All tasks" },
  { id: "recount", label: "Recounts" },
  { id: "damage", label: "Damage claims" },
];

export const DAMAGE_LIABILITY_OPTIONS: {
  id: SupervisorDamageLiability;
  label: string;
  description: string;
}[] = [
  {
    id: "vhotis",
    label: "Vhotis liable",
    description: "Warehouse or handling fault.",
  },
  {
    id: "seller",
    label: "Seller liable",
    description: "Product or packaging issue from seller.",
  },
  {
    id: "carrier",
    label: "Carrier liable",
    description: "Damage occurred in transit.",
  },
  {
    id: "disputed",
    label: "Disputed",
    description: "Liability unclear — keep under review.",
  },
];

export function formatDamageType(type: SupervisorDamageType): string {
  switch (type) {
    case "warehouse_fault":
      return "Warehouse fault";
    case "arrived_damaged":
      return "Arrived damaged";
    case "expired":
      return "Expired";
    case "pest":
      return "Pest / contamination";
    default:
      return "Other";
  }
}

export function formatDamageLiability(liability: SupervisorDamageLiability): string {
  return (
    DAMAGE_LIABILITY_OPTIONS.find((option) => option.id === liability)?.label ??
    liability
  );
}

export function recountTaskSubtitle(task: SupervisorRecountTask): string {
  return `${task.locationDetail} · system ${task.quantityOnHand} on hand · found ${task.quantityFound}/${task.quantityRequired}`;
}

export function damageClaimSubtitle(claim: SupervisorDamageClaimTask): string {
  return `${claim.locationDetail} · ${formatDamageType(claim.damageType)} · ${claim.quantityDamaged} unit${claim.quantityDamaged === 1 ? "" : "s"}`;
}

export function validateRecountSubmit(params: {
  countedQty: string;
  quantityReserved: number;
}): string | null {
  const parsed = Number.parseInt(params.countedQty, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return "Enter a valid counted quantity.";
  }
  if (parsed < params.quantityReserved) {
    return `Counted quantity cannot be below reserved stock (${params.quantityReserved}).`;
  }
  return null;
}

export function supervisorHasInventoryAccess(
  hasPermission: (key: "override_stock_counts" | "approve_damage_claims") => boolean,
): boolean {
  return (
    hasPermission("override_stock_counts") ||
    hasPermission("approve_damage_claims")
  );
}
