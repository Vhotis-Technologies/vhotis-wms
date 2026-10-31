import { FloorItemPanel } from "@/app/components/shared/FloorLayout";

interface ItemDetailCardProps {
  productName: string;
  sku: string;
  sectionLabel?: string;
}

export default function ItemDetailCard({
  productName,
  sku,
  sectionLabel = "PICK THIS ITEM",
}: ItemDetailCardProps) {
  return (
    <FloorItemPanel
      productName={productName}
      sku={sku}
      sectionLabel={sectionLabel}
    />
  );
}
