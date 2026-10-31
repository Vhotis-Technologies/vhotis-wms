import { FloorZoneTag } from "@/app/components/shared/FloorLayout";
import type { ZoneBadge as ZoneBadgeType } from "@/interfaces/picker";

interface ZoneBadgeProps {
  zone: ZoneBadgeType;
}

export default function ZoneBadge({ zone }: ZoneBadgeProps) {
  return <FloorZoneTag zone={zone} />;
}
