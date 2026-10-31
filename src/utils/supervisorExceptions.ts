import type { ZoneBadge } from "@/interfaces/picker";
import type { PickExceptionType, PickExceptionSummary } from "@/interfaces/supervisor";

export const STALE_EXCEPTION_MINUTES = 5;

export const EXCEPTION_TYPE_FILTERS: {
  id: "all" | PickExceptionType;
  label: string;
}[] = [
  { id: "all", label: "All types" },
  { id: "short_pick", label: "Short pick" },
  { id: "location_empty", label: "Empty location" },
  { id: "wrong_product", label: "Wrong product" },
  { id: "damaged_stock", label: "Damaged stock" },
  { id: "label_unreadable", label: "Unreadable label" },
  { id: "product_mismatch", label: "Product mismatch" },
  { id: "other", label: "Other" },
];

export const EXCEPTION_ZONE_FILTERS: {
  id: "all" | ZoneBadge;
  label: string;
}[] = [
  { id: "all", label: "All zones" },
  { id: "AMB", label: "Ambient" },
  { id: "CHL", label: "Chilled" },
  { id: "FRZ", label: "Frozen" },
];

export function formatExceptionAge(ageMinutes: number): string {
  if (ageMinutes < 1) {
    return "Just now";
  }
  if (ageMinutes < 60) {
    return `${ageMinutes}m waiting`;
  }
  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;
  if (minutes === 0) {
    return `${hours}h waiting`;
  }
  return `${hours}h ${minutes}m waiting`;
}

export function sortPickExceptions(
  exceptions: PickExceptionSummary[],
): PickExceptionSummary[] {
  return [...exceptions].sort((a, b) => {
    if (a.isStale !== b.isStale) {
      return a.isStale ? -1 : 1;
    }
    return b.ageMinutes - a.ageMinutes;
  });
}

export function filterPickExceptions(
  exceptions: PickExceptionSummary[],
  typeFilter: "all" | PickExceptionType,
  zoneFilter: "all" | ZoneBadge,
): PickExceptionSummary[] {
  return exceptions.filter((item) => {
    const typeMatch =
      typeFilter === "all" || item.exceptionType === typeFilter;
    const zoneMatch = zoneFilter === "all" || item.zone === zoneFilter;
    return typeMatch && zoneMatch;
  });
}
