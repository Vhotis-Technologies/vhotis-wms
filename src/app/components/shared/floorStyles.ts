import type { ViewStyle } from "react-native";

export const FLOOR_BORDER = 1;
export const FLOOR_BORDER_HEAVY = 2;
export const FLOOR_ACCENT_WIDTH = 4;

export const flatButton = {
  borderRadius: 0,
  paddingVertical: 14,
} as const;

export const flatPanel: ViewStyle = {
  borderWidth: FLOOR_BORDER,
  borderRadius: 0,
};

export const flatRow: ViewStyle = {
  borderWidth: FLOOR_BORDER,
  borderRadius: 0,
};

/** @deprecated Use FLOOR_* from floorStyles */
export const SORTER_BORDER = FLOOR_BORDER;
/** @deprecated Use FLOOR_* from floorStyles */
export const SORTER_ACCENT_WIDTH = FLOOR_ACCENT_WIDTH;
