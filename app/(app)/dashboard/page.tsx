import type { Metadata } from "next";
import { KpiGrid } from "@/components/kpi-cards";
import { PageHeader } from "@/components/page-header";
import { RecentActivity } from "@/components/recent-activity";
import { ErrorState, ForbiddenState, SampleNotice } from "@/components/resource-state";
import { getRecords } from "@/lib/data";
import { kpisFromRecords } from "@/lib/sample-data";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const result = await getRecords();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Workspace totals for the records you can read."
      />
      {result.status === "forbidden" ? <ForbiddenState message={result.message} /> : null}
      {result.status === "error" ? <ErrorState message={result.message} /> : null}
      {result.status === "ready" ? (
        <>
          {result.source === "sample" ? <SampleNotice table="records" /> : null}
          <div className="flex flex-col gap-6">
            <KpiGrid items={kpisFromRecords(result.data)} />
            <RecentActivity records={result.data} />
          </div>
        </>
      ) : null}
    </>
  );
}
