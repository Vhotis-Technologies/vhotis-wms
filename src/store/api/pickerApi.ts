import type {
  PickExceptionPhotoDraft,
  PickJobDetail,
  PickJobSummary,
  PickerDashboardStats,
  PickScanResult,
  RaiseShortPickParams,
  SubmitPickScanParams,
} from "@/interfaces/picker";
import { wmsFetch, wmsUploadFile } from "@/store/api/client";
import {
  mapPickJobDetail,
  pickJobDetailToSummary,
  mapPickScanResult,
  shouldIncludeInPickQueue,
} from "@/store/api/pickerMappers";
import { getNextScanTypeForLine } from "@/utils/pickerScan";

type UploadPhotoResponse = {
  url: string;
  path: string;
};

export function uploadPickExceptionPhoto(
  photo: PickExceptionPhotoDraft,
): Promise<string> {
  return wmsUploadFile<UploadPhotoResponse>(
    "/api/v3/ops/upload_pick_exception_photo/",
    "image",
    {
      uri: photo.uri,
      name: photo.fileName ?? "pick-exception.jpg",
      type: photo.mimeType ?? "image/jpeg",
    },
  ).then((response) => response.url);
}

export async function uploadPickExceptionPhotos(
  photos: PickExceptionPhotoDraft[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const photo of photos) {
    urls.push(await uploadPickExceptionPhoto(photo));
  }
  return urls;
}

export function listPickJobs(_warehouseId: number): Promise<PickJobSummary[]> {
  return wmsFetch<unknown[]>(
    `/api/v3/ops/list_pick_jobs/?warehouse_id=${_warehouseId}&status=reserved,picking`,
  ).then((rows) =>
    rows
      .map((row) => mapPickJobDetail(row as never))
      .filter(shouldIncludeInPickQueue)
      .map(pickJobDetailToSummary),
  );
}

export function getPickJob(
  warehouseId: number,
  fulfillmentRequestId: string,
): Promise<PickJobDetail> {
  return wmsFetch<unknown>(
    `/api/v3/ops/get_pick_job/?warehouse_id=${warehouseId}&fulfillment_request_id=${fulfillmentRequestId}`,
  ).then((row) => mapPickJobDetail(row as never));
}

export async function startPickJob(
  warehouseId: number,
  fulfillmentRequestId: string,
  pickerId: number,
): Promise<PickJobDetail> {
  const raw = await wmsFetch<unknown>("/api/v3/ops/start_pick/", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: warehouseId,
      fulfillment_request_id: fulfillmentRequestId,
      picker_id: pickerId,
    }),
  });
  return mapPickJobDetail(raw as never);
}

export function getPickerStats(inQueue = 0): Promise<PickerDashboardStats> {
  return Promise.resolve({
    pickedToday: 0,
    inQueue,
    accuracy: 0,
  });
}

export function submitPickScan(params: SubmitPickScanParams): Promise<PickScanResult> {
  return wmsFetch<unknown>("/api/v3/ops/pick_scan/", {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: params.warehouseId,
      pick_line_id: params.pickLineId,
      picker_id: params.pickerId,
      scan_type: params.scanType,
      payload: params.payload,
      fulfillment_request_id: params.jobId,
    }),
  })
    .then((row) => mapPickScanResult(row as never))
    .then(async (mapped) => {
      const refreshed = await getPickJob(params.warehouseId, params.jobId);
      return {
        ...mapped,
        fulfillment_request: refreshed,
      };
    });
}

export async function raiseShortPick(params: RaiseShortPickParams): Promise<void> {
  let photoUrls = params.photoUrls ?? [];
  if (params.photos?.length) {
    photoUrls = await uploadPickExceptionPhotos(params.photos);
  }

  await wmsFetch<void>("/api/v3/ops/raise_pick_exception/", {
    method: "POST",
    body: JSON.stringify({
      pick_line_id: params.pickLineId,
      picker_id: params.pickerId,
      exception_type: params.exceptionType,
      quantity_found: params.quantityFound ?? 0,
      notes: params.notes ?? "",
      photo_urls: photoUrls,
    }),
  });
}

export { getNextScanTypeForLine };
