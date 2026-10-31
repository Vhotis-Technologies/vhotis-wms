export {
  FloorChromeFooter as FloorHubChromeFooter,
  FloorChromeHeader as FloorHubChromeHeader,
} from "@/app/components/shared/FloorLayout";

import { FloorChromeFooter, FloorChromeHeader } from "@/app/components/shared/FloorLayout";

interface FloorHubChromeProps {
  variant?: "header" | "footer" | "both";
}

export default function FloorHubChrome({
  variant = "both",
}: FloorHubChromeProps) {
  const showHeader = variant === "header" || variant === "both";
  const showFooter = variant === "footer" || variant === "both";

  return (
    <>
      {showHeader ? <FloorChromeHeader /> : null}
      {showFooter ? <FloorChromeFooter /> : null}
    </>
  );
}
