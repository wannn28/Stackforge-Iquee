import type { Metadata } from "next";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ErrorState, ForbiddenState, SampleNotice } from "@/components/resource-state";
import { getRecords } from "@/lib/data";

export const metadata: Metadata = { title: "Data" };

export default async function DataPage() {
  const result = await getRecords();

  return (
    <>
      <PageHeader title="Data" description="Search, filter, and page through workspace records." />
      {result.status === "forbidden" ? <ForbiddenState message={result.message} /> : null}
      {result.status === "error" ? <ErrorState message={result.message} /> : null}
      {result.status === "ready" ? (
        <>
          {result.source === "sample" ? <SampleNotice table="records" /> : null}
          <DataTable rows={result.data} />
        </>
      ) : null}
    </>
  );
}
