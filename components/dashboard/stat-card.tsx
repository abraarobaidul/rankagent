import { cn, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  isDemo?: boolean;
  className?: string;
  suffix?: string;
}

export function StatCard({ title, value, change, changeLabel, icon, isDemo, className, suffix }: StatCardProps) {
  const formattedValue = typeof value === "number" ? formatNumber(value) : value;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">
                {formattedValue}
              </span>
              {suffix && <span className="text-sm text-muted-foreground mb-0.5">{suffix}</span>}
            </div>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-muted-foreground"
              )}>
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : change < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                <span>{change > 0 ? "+" : ""}{change}</span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          {icon && (
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {icon}
            </div>
          )}
        </div>
        {isDemo && (
          <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-yellow-500" title="Demo data" />
        )}
      </CardContent>
    </Card>
  );
}
