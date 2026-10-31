import type { WarehouseEmployee } from "@/interfaces/auth";
import type {
  FloorWorkArea,
  ManagementRole,
  SupervisorDashboardStats,
  SupervisorFloorStaffMember,
  SupervisorHomeSection,
  SupervisorJobSegment,
  SupervisorJobSummary,
  SupervisorPermissionKey,
  SupervisorPulseTile,
} from "@/interfaces/supervisor";

export const SUPERVISOR_HOME_POLL_MS = 60_000;

export const SUPERVISOR_HISTORY_DAY_FILTERS: { id: number; label: string }[] = [
  { id: 1, label: "Today" },
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
];

export const SUPERVISOR_HOME_SECTIONS: SupervisorHomeSection[] = [
  {
    id: "exceptions",
    title: "Pick exceptions",
    description: "Review and resolve floor exceptions blocking pick and pack.",
    route: "/main/supervisor/exceptions",
    permission: "approve_exceptions",
    phase: 2,
  },
  {
    id: "floor",
    title: "Floor live",
    description: "See who is clocked in and reassign work areas or jobs.",
    route: "/main/supervisor/floor",
    permission: "manage_assignments",
    phase: 8,
  },
  {
    id: "jobs",
    title: "Job board",
    description: "Browse fulfillment jobs across pick, pack, and dispatch.",
    route: "/main/supervisor/jobs",
    phase: 6,
  },
  {
    id: "inbound",
    title: "Inbound approvals",
    description: "Sign off receiving variances and dock exceptions.",
    route: "/main/supervisor/inbound",
    permission: "approve_inbound_shipments",
    phase: 10,
  },
  {
    id: "inventory",
    title: "Inventory tasks",
    description: "Confirm recounts, overrides, and damage claims.",
    route: "/main/supervisor/inventory",
    phase: 11,
  },
];

export function formatManagementRole(role?: ManagementRole | null): string {
  if (role === "manager") {
    return "Manager";
  }
  return "Supervisor";
}

export function formatSupervisorShiftLabel(
  employee?: WarehouseEmployee | null,
): string {
  const warehouseCode = employee?.warehouse_code;
  const role = employee?.supervisor_profile?.management_role;

  if (warehouseCode) {
    return `${formatManagementRole(role)} · ${warehouseCode}`;
  }
  return formatManagementRole(role);
}

export function supervisorHasPermission(
  employee: WarehouseEmployee | null | undefined,
  permission: SupervisorPermissionKey,
): boolean {
  const profile = employee?.supervisor_profile;
  if (!profile) {
    return false;
  }

  switch (permission) {
    case "approve_exceptions":
      return profile.can_approve_exceptions;
    case "override_stock_counts":
      return profile.can_override_stock_counts;
    case "approve_inbound_shipments":
      return profile.can_approve_inbound_shipments;
    case "manage_assignments":
      return profile.can_manage_assignments;
    case "approve_damage_claims":
      return profile.can_approve_damage_claims;
    default:
      return false;
  }
}

export function supervisorExceptionDetailHref(exceptionId: number): string {
  return `/main/supervisor/exceptions/${exceptionId}`;
}

export function supervisorJobDetailHref(jobId: string): string {
  return `/main/supervisor/jobs/${jobId}`;
}

export function buildSupervisorJobHref(
  segment?: SupervisorJobSegment | "all",
): string {
  if (!segment || segment === "all") {
    return "/main/supervisor/jobs";
  }
  return `/main/supervisor/jobs?segment=${segment}`;
}

export function buildSupervisorFloorHref(): string {
  return "/main/supervisor/floor";
}

export function buildSupervisorInboundHref(): string {
  return "/main/supervisor/inbound";
}

export function supervisorInboundDetailHref(shipmentId: string): string {
  return `/main/supervisor/inbound/${encodeURIComponent(shipmentId)}`;
}

export function buildSupervisorInventoryHref(): string {
  return "/main/supervisor/inventory";
}

export function supervisorRecountTaskHref(exceptionId: number): string {
  return `/main/supervisor/inventory/recount/${exceptionId}`;
}

export function supervisorDamageClaimDetailHref(claimId: number): string {
  return `/main/supervisor/inventory/damage/${claimId}`;
}

export function buildSupervisorHistoryHref(): string {
  return "/main/supervisor/history";
}

export function buildSupervisorSettingsHref(): string {
  return "/main/supervisor/settings";
}

export function supervisorFloorEmployeeHref(employeeId: string): string {
  return `/main/supervisor/floor/${encodeURIComponent(employeeId)}`;
}

export const FLOOR_WORK_AREA_SECTIONS: {
  id: FloorWorkArea;
  label: string;
  description: string;
}[] = [
  {
    id: "inbound",
    label: "Inbound / sort",
    description: "Receiving, sort, and putaway",
  },
  {
    id: "pick",
    label: "Pick floor",
    description: "Active pick shifts",
  },
  {
    id: "pack",
    label: "Pack station",
    description: "Verification and dispatch prep",
  },
];

export function formatFloorWorkArea(area: FloorWorkArea): string {
  switch (area) {
    case "inbound":
      return "Inbound / sort";
    case "pick":
      return "Pick";
    case "pack":
      return "Pack";
    default:
      return area;
  }
}

export function formatFloorStaffStatus(member: SupervisorFloorStaffMember): string {
  if (member.isOnBreak || member.floorStatus === "on_break") {
    return "On break";
  }
  if (member.isOnJob && member.currentOrderId) {
    return `On job · ${member.currentOrderId}`;
  }
  if (member.isOnJob) {
    return "On job";
  }
  if (member.floorStatus === "active") {
    return "Available";
  }
  return member.floorStatus.replaceAll("_", " ");
}

export function formatShiftDuration(minutes: number): string {
  if (minutes < 1) {
    return "Just clocked in";
  }
  if (minutes < 60) {
    return `${minutes}m on shift`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `${hours}h on shift`;
  }
  return `${hours}h ${remainder}m on shift`;
}

export const SUPERVISOR_JOB_SEGMENT_FILTERS: {
  id: SupervisorJobSegment | "all";
  label: string;
}[] = [
  { id: "all", label: "All active" },
  { id: "blocked", label: "Blocked" },
  { id: "picking", label: "Picking" },
  { id: "ready_to_pack", label: "Ready to pack" },
  { id: "packing", label: "Packing" },
  { id: "dispatch", label: "Dispatch" },
];

export function formatSupervisorJobSegment(segment: SupervisorJobSegment): string {
  switch (segment) {
    case "blocked":
      return "Blocked";
    case "picking":
      return "Picking";
    case "ready_to_pack":
      return "Ready to pack";
    case "packing":
      return "Packing";
    case "dispatch":
      return "Dispatch";
    default:
      return segment;
  }
}

export function supervisorJobHubSubtitle(job: SupervisorJobSummary): string {
  const assignee =
    job.segment === "packing" || job.segment === "ready_to_pack"
      ? job.assignedPackerName || "Unassigned packer"
      : job.assignedPickerName || "Unassigned picker";

  return `${job.storeName} · ${formatSupervisorJobSegment(job.segment)} · ${assignee}`;
}

export function supervisorJobCardTitle(job: SupervisorJobSummary): string {
  if (job.segment === "packing" || job.segment === "ready_to_pack") {
    return `${job.unitsVerified}/${job.unitsRequired} units verified`;
  }
  return `${job.itemCount} pick line${job.itemCount === 1 ? "" : "s"}`;
}

export function formatStatsGeneratedLabel(generatedAt?: string | null): string {
  if (!generatedAt) {
    return "Not updated yet";
  }

  const ageMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(generatedAt).getTime()) / 60_000),
  );

  if (ageMinutes < 1) {
    return "Updated just now";
  }
  if (ageMinutes < 60) {
    return `Updated ${ageMinutes}m ago`;
  }

  const hours = Math.floor(ageMinutes / 60);
  return `Updated ${hours}h ago`;
}

export function buildSupervisorPulseTiles(
  stats: SupervisorDashboardStats,
  options?: {
    canApproveExceptions?: boolean;
    canApproveInbound?: boolean;
  },
): SupervisorPulseTile[] {
  const canApproveExceptions = options?.canApproveExceptions ?? true;
  const canApproveInbound = options?.canApproveInbound ?? true;

  return [
    {
      id: "exceptions",
      value: stats.pendingExceptions,
      label: "Exceptions",
      tone: stats.staleExceptions > 0 ? "warning" : "primary",
      route: canApproveExceptions ? "/main/supervisor/exceptions" : undefined,
      disabled: !canApproveExceptions,
    },
    {
      id: "blocked",
      value: stats.blockedJobs,
      label: "Blocked jobs",
      tone: stats.blockedJobs > 0 ? "warning" : "primary",
      route: buildSupervisorJobHref("blocked"),
    },
    {
      id: "pick",
      value: stats.pickQueue,
      label: "Pick queue",
      tone: "primary",
      route: buildSupervisorJobHref("picking"),
    },
    {
      id: "pack",
      value: stats.packQueue,
      label: "Pack queue",
      tone: "primary",
      route: buildSupervisorJobHref("ready_to_pack"),
    },
    {
      id: "inbound",
      value: stats.inboundReceiving,
      label: "Inbound dock",
      tone: stats.inboundReceiving > 0 ? "warning" : "primary",
      route: canApproveInbound ? buildSupervisorInboundHref() : undefined,
      disabled: !canApproveInbound,
    },
    {
      id: "dispatch",
      value: stats.dispatchedToday,
      label: "Dispatched",
      tone: "success",
      route: buildSupervisorJobHref("dispatch"),
    },
    {
      id: "staff",
      value: stats.staffOnFloor.total,
      label: "On floor",
      tone: "success",
      route: buildSupervisorFloorHref(),
    },
  ];
}
