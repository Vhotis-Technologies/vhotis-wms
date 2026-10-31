import { FloorLocationPanel } from "@/app/components/shared/FloorLayout";

interface LocationGuidanceCardProps {
  locationCode: string;
  locationDetail: string;
  sectionLabel?: string;
}

export default function LocationGuidanceCard({
  locationCode,
  locationDetail,
  sectionLabel = "GO TO LOCATION",
}: LocationGuidanceCardProps) {
  return (
    <FloorLocationPanel
      locationCode={locationCode}
      locationDetail={locationDetail}
      sectionLabel={sectionLabel}
    />
  );
}
