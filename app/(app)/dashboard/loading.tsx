import { KpiSkeleton } from "@/components/kpi-cards";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <>
      <PageHeader title="Dashboard" description="Workspace totals for the records you can read." />
      <div className="flex flex-col gap-6">
        <KpiSkeleton />
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-2 h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
