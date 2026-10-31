import { FloorQuantityStrip } from "@/app/components/shared/FloorLayout";

interface QuantityTilesProps {
  required: number;
  picked: number;
}

export default function QuantityTiles({ required, picked }: QuantityTilesProps) {
  return (
    <FloorQuantityStrip required={required} count={picked} countLabel="PICKED" />
  );
}
