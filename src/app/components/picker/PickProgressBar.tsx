import { FloorLineProgress } from "@/app/components/shared/FloorLayout";

interface PickProgressBarProps {
  current: number;
  total: number;
  label: string;
  orderId: string;
  storeName: string;
}

export default function PickProgressBar({
  current,
  total,
  label,
  orderId,
  storeName,
}: PickProgressBarProps) {
  return (
    <FloorLineProgress
      current={current}
      total={total}
      label={label}
      referenceId={orderId}
      subtitle={storeName}
    />
  );
}
