import type { PickExceptionRecord } from "@/interfaces/supervisor";
import type { SupervisorJobDetail } from "@/interfaces/supervisor";
import { mapPickJobDetail } from "@/store/api/pickerMappers";
import { mapPackJobDetail } from "@/store/api/packerMappers";
import { mapPickExceptionSummaries } from "@/store/api/supervisorMappers";
import { mapSupervisorJobSummary } from "@/store/api/supervisorJobMappers";

type RawSupervisorJobDetail = Parameters<typeof mapSupervisorJobSummary>[0] & {
  warehouse_code?: string;
  created_at?: string;
  dispatched_at?: string | null;
  show_pack?: boolean;
  pick_lines?: Parameters<typeof mapPickJobDetail>[0]["pick_lines"];
  pack_lines?: Parameters<typeof mapPackJobDetail>[0]["pack_lines"];
  box_hint?: string;
  station_label?: string;
  label_printed?: boolean;
  label_linked?: boolean;
  exceptions?: PickExceptionRecord[];
};

export function mapSupervisorJobDetail(
  record: RawSupervisorJobDetail,
): SupervisorJobDetail {
  const summary = mapSupervisorJobSummary(record);
  const pickJob = mapPickJobDetail({
    id: record.id,
    order_id: record.order_id,
    store_name: record.store_name,
    item_count: record.item_count,
    zones: record.zones,
    status: record.status,
    pick_lines: record.pick_lines,
    assigned_picker: record.assigned_picker_id,
  });

  const showPack = Boolean(record.show_pack);
  const packJob = showPack
    ? mapPackJobDetail({
        id: record.id,
        order_id: record.order_id,
        store_name: record.store_name,
        item_count: record.item_count,
        pack_lines: record.pack_lines,
        box_hint: record.box_hint,
        station_label: record.station_label,
        pack_status: record.pack_status,
        status: record.status,
        units_verified: record.units_verified,
        units_required: record.units_required,
        label_printed: record.label_printed,
        label_linked: record.label_linked,
        assigned_packer: record.assigned_packer_id,
      })
    : null;

  const exceptions = mapPickExceptionSummaries(record.exceptions ?? []);
  const pendingExceptions = exceptions.filter((item) => item.isPending);
  const resolvedExceptions = exceptions.filter((item) => !item.isPending);

  return {
    ...summary,
    warehouseCode: record.warehouse_code ?? "",
    showPack,
    pickLines: pickJob.pick_lines,
    packLines: packJob?.pack_lines ?? [],
    boxHint: packJob?.box_hint ?? "",
    stationLabel: packJob?.station_label ?? "",
    labelPrinted: packJob?.label_printed ?? false,
    labelLinked: packJob?.label_linked ?? false,
    exceptions,
    pendingExceptions,
    resolvedExceptions,
    createdAt: record.created_at ?? summary.updatedAt,
    dispatchedAt: record.dispatched_at ?? null,
  };
}
