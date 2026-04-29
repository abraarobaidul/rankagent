import { Badge } from "@/components/ui/badge";

export function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "CRITICAL") return <Badge variant="destructive">Critical</Badge>;
  if (severity === "WARNING") return <Badge variant="warning">Warning</Badge>;
  return <Badge variant="info">Notice</Badge>;
}
