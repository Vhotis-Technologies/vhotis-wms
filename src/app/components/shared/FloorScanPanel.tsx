import type { ComponentProps } from "react";

import FloorScanStage from "@/app/components/shared/FloorScanStage";

export type FloorScanPanelProps = ComponentProps<typeof FloorScanStage>;

export default function FloorScanPanel(props: FloorScanPanelProps) {
  return <FloorScanStage {...props} />;
}
