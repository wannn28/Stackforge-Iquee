import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Kpi } from "@/lib/types";
import { cn } from "@/lib/utils";

const hintTone = {
  default: "text-muted",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const;

function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <p className="text-caption text-muted">{item.label}</p>
          <p className="mt-2 text-display text-foreground">{item.value}</p>
          <p className={cn("mt-2 text-caption", hintTone[item.tone])}>{item.hint}</p>
        </Card>
      ))}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="p-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-3 h-4 w-28" />
        </Card>
      ))}
    </div>
  );
}

export { KpiGrid, KpiSkeleton };
