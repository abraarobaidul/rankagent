import { Badge } from "@/components/ui/badge";

export function LinkStatusBadge({ status }: { status: string }) {
  if (status === "NEW") return <Badge variant="success">New</Badge>;
  if (status === "LOST") return <Badge variant="destructive">Lost</Badge>;
  return <Badge variant="info">Active</Badge>;
}

export function FollowBadge({ isFollow }: { isFollow: boolean }) {
  return (
    <Badge variant={isFollow ? "outline" : "secondary"}>
      {isFollow ? "Dofollow" : "Nofollow"}
    </Badge>
  );
}
