import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ErrorState, ForbiddenState, SampleNotice } from "@/components/resource-state";
import { UsersPanel } from "@/components/users-panel";
import { getMembers } from "@/lib/data";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const result = await getMembers();

  return (
    <>
      <PageHeader title="Users" description="Roles and people in this workspace." />
      {result.status === "forbidden" ? <ForbiddenState message={result.message} /> : null}
      {result.status === "error" ? <ErrorState message={result.message} /> : null}
      {result.status === "ready" ? (
        <>
          {result.source === "sample" ? <SampleNotice table="profiles" /> : null}
          <UsersPanel members={result.data} />
        </>
      ) : null}
    </>
  );
}
