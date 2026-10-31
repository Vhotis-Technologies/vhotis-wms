import type {
  LinkPackLabelParams,
  PackHandoffResult,
  PackJobDetail,
  PackJobSummary,
  PackerDashboardStats,
  PackScanResult,
  SubmitPackScanParams,
} from "@/interfaces/packer";
import { wmsFetch } from "@/store/api/client";
import {
  mapPackJobDetail,
  mapPackScanResult,
  mapPackerStats,
  packJobDetailToSummary,
  shouldIncludeInPackQueue,
} from "@/store/api/packerMappers";

export function listPackJobs(warehouseId: number): Promise<PackJobSummary[]> {
  return wmsFetch<unknown[]>(
    `/api/v3/ops/list_pack_jobs/?warehouse_id=${warehouseId}`,
  ).then((rows) =>
    rows
      .map((row) => mapPackJobDetail(row as never))
      .filter(shouldIncludeInPackQueue)
      .map(packJobDetailToSummary),
  );
}

export function getPackJob(
  warehouseId: number,
  fulfillmentRequestId: string,
): Promise<PackJobDetail> {
  return wmsFetch<unknown>(
    `/api/v3/ops/get_pick_job/?warehouse_id=${warehouseId}&fulfillment_request_id=${fulfillmentRequestId}`,
  ).then((row) => mapPackJobDetail(row as never));
}

export function getPackerStats(
  warehouseId: number,
  packerId?: number,
): Promise<PackerDashboardStats> {
  const params = new URLSearchParams({
    warehouse_id: String(warehouseId),
  });
  if (packerId) {
    params.set("packer_id", String(packerId));
  }
  return wmsFetch<unknown>(
    `/api/v3/ops/packer_stats/?${params.toString()}`,
  ).then((row) => mapPackerStats(row as never));
}

export function startPack(
  warehouseId: number,
  jobId: string,
  packerId: number,
): Promise<PackJobDetail> {
  return wmsFetch<unknown>("/api/v3/ops/start_pack/", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: warehouseId,
      fulfillment_request_id: jobId,
      packer_id: packerId,
    }),
  }).then((row) => mapPackJobDetail(row as never));
}

export function submitPackScan(
  params: SubmitPackScanParams,
): Promise<PackScanResult> {
  return wmsFetch<unknown>("/api/v3/ops/pack_scan/", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: params.warehouseId,
      fulfillment_request_id: params.jobId,
      packer_id: params.packerId,
      payload: params.payload,
    }),
  })
    .then((row) => mapPackScanResult(row as never, {} as PackJobDetail))
    .then(async (mapped) => {
      const refreshed = await getPackJob(params.warehouseId, params.jobId);
      return {
        ...mapped,
        job: refreshed,
      };
    });
}

export function printPackLabel(
  warehouseId: number,
  jobId: string,
  packerId?: number,
  options?: { reprint?: boolean },
): Promise<PackJobDetail> {
  return wmsFetch<unknown>("/api/v3/ops/print_pack_label/", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: warehouseId,
      fulfillment_request_id: jobId,
      packer_id: packerId,
      reprint: Boolean(options?.reprint),
    }),
  }).then((row) => mapPackJobDetail(row as never));
}

export function linkPackLabel(
  warehouseId: number,
  params: LinkPackLabelParams,
): Promise<PackJobDetail> {
  return wmsFetch<unknown>("/api/v3/ops/link_pack_label/", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: warehouseId,
      fulfillment_request_id: params.jobId,
      packer_id: params.packerId,
      payload: params.payload,
    }),
  }).then((row) => mapPackJobDetail(row as never));
}

export function completePack(
  warehouseId: number,
  jobId: string,
  packerId: number,
): Promise<PackJobDetail> {
  return wmsFetch<unknown>("/api/v3/ops/complete_pack/", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: warehouseId,
      fulfillment_request_id: jobId,
      packer_id: packerId,
    }),
  }).then((row) => mapPackJobDetail(row as never));
}

export function handOffToRider(
  warehouseId: number,
  jobId: string,
): Promise<PackHandoffResult> {
  return wmsFetch<{
    message?: string;
    status?: string;
    fulfillment_request?: unknown;
  }>("/api/v3/ops/hand_off_to_rider/", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: warehouseId,
      fulfillment_request_id: jobId,
    }),
  }).then((row) => {
    const job = mapPackJobDetail((row.fulfillment_request ?? row) as never);
    return {
      message:
        row.message ??
        "Job marked ready for dispatch. Rider dispatch will be scheduled shortly.",
      status: job.status,
      job,
    };
  });
}
