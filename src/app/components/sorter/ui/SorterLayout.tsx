import {
  FloorChromeFooter,
  FloorChromeHeader,
  FloorHubHeader,
  FloorItemPanel,
  FloorLineProgress,
  FloorLocationPanel,
  FloorQuantityStrip,
  FloorSectionBand,
  FloorStatGrid,
  FloorStatusStripe,
  FloorZoneTag,
  type FloorStatItem,
} from "@/app/components/shared/FloorLayout";
import { useThemeColor } from "@/hooks/useThemeColor";

export {
  FloorChromeHeader as SorterChromeHeader,
  FloorChromeFooter as SorterChromeFooter,
  FloorSectionBand as SorterSectionBand,
  FloorZoneTag as SorterZoneTag,
  FloorStatusStripe as SorterStatusStripe,
  FloorItemPanel as SorterItemPanel,
  FloorLocationPanel as SorterLocationPanel,
  FloorStatGrid as SorterStatGrid,
};

export type SorterStatItem = FloorStatItem;

export function SorterHubHeader({
  employeeName,
  dockLabel,
}: {
  employeeName: string;
  dockLabel: string;
}) {
  const warningColor = useThemeColor({}, "warning");

  return (
    <FloorHubHeader
      employeeName={employeeName}
      badgeLabel={dockLabel}
      titleBand="INBOUND SORTING"
      bandColor={warningColor}
    />
  );
}

export function SorterLineProgress({
  current,
  total,
  label,
  shipmentId,
  productName,
}: {
  current: number;
  total: number;
  label: string;
  shipmentId: string;
  productName: string;
}) {
  return (
    <FloorLineProgress
      current={current}
      total={total}
      label={label}
      referenceId={shipmentId}
      subtitle={productName}
    />
  );
}

export function SorterQuantityStrip({
  required,
  stored,
}: {
  required: number;
  stored: number;
}) {
  return (
    <FloorQuantityStrip required={required} count={stored} countLabel="STORED" />
  );
}
