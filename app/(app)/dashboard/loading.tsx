import { KpiSkeleton } from "@/components/kpi-cards";
import { PageHeader } from "@/components/page-header";

export default function DashboardLoading() {
  return (
    <>
      <PageHeader title="Dashboard" description="Workspace totals for the records you can read." />
      <KpiSkeleton />
    </>
  );
}
