"use client";
import { useSession } from "next-auth/react";
import { Bell, Database } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TopNavProps {
  title?: string;
  isDemoMode?: boolean;
}

export function TopNav({ title, isDemoMode = false }: TopNavProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 shrink-0">
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
        )}
        {isDemoMode && (
          <Badge variant="warning" className="gap-1 text-xs">
            <Database className="h-3 w-3" />
            Demo Data
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
