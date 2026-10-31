import * as ImagePicker from "expo-image-picker";

import type { PickExceptionPhotoDraft, PickExceptionType } from "@/interfaces/picker";

export const MAX_PICK_EXCEPTION_PHOTOS = 3;

export type { PickExceptionPhotoDraft };

export function pickExceptionRequiresPhotos(type: PickExceptionType): boolean {
  return (
    type === "damaged_stock" ||
    type === "wrong_product" ||
    type === "product_mismatch" ||
    type === "label_unreadable"
  );
}

export function pickExceptionPhotoHint(type: PickExceptionType): string {
  if (pickExceptionRequiresPhotos(type)) {
    return "Add at least one photo so supervisors can review the issue.";
  }
  return "Optional — attach photos of the bin, label, or product.";
}

function inferFileName(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.fileName) {
    return asset.fileName;
  }
  const ext = asset.mimeType?.includes("png") ? "png" : "jpg";
  return `pick-exception-${Date.now()}.${ext}`;
}

function toDraft(asset: ImagePicker.ImagePickerAsset): PickExceptionPhotoDraft {
  return {
    uri: asset.uri,
    fileName: inferFileName(asset),
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === "granted";
}

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
}

export async function capturePickExceptionPhoto(): Promise<PickExceptionPhotoDraft | null> {
  if (!(await ensureCameraPermission())) {
    throw new Error("Camera permission is required to take evidence photos.");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.75,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return toDraft(result.assets[0]);
}

export async function pickPickExceptionPhotoFromLibrary(): Promise<PickExceptionPhotoDraft | null> {
  if (!(await ensureLibraryPermission())) {
    throw new Error("Photo library permission is required to attach evidence.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.75,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return toDraft(result.assets[0]);
}
