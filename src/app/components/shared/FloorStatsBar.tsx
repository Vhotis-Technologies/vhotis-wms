import {
  FloorStatGrid,
  type FloorStatItem,
} from "@/app/components/shared/FloorLayout";

export type FloorStatTone = "success" | "warning" | "primary";

export interface FloorStatItemLegacy {
  value: string | number;
  label: string;
  tone?: FloorStatTone;
}

interface FloorStatsBarProps {
  items: FloorStatItemLegacy[];
}

export default function FloorStatsBar({ items }: FloorStatsBarProps) {
  const mapped: FloorStatItem[] = items.map((item) => ({
    value: item.value,
    label: item.label,
    tone: item.tone,
  }));

  return <FloorStatGrid items={mapped} />;
}
