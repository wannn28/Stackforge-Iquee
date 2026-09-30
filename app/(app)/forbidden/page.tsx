import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <>
      <PageHeader title="Access" description="What happens when a policy blocks a request." />
      <Card className="max-w-xl p-6">
        <div className="grid size-10 place-items-center rounded-md bg-danger/10 text-danger">
          <ShieldAlert className="size-5" aria-hidden />
        </div>
        <h2 className="mt-4 text-h1 text-foreground">You don&apos;t have access</h2>
        <p className="mt-2 text-body text-muted">
          Row-level security rejected this request. Stackforge stays on this screen instead of
          rendering a blank page. The anon key is used in the browser. The service-role key never
          is, so a denied policy stays denied.
        </p>
        <ul className="mt-4 flex flex-col gap-2 text-body text-muted">
          <li>Reads that the policy hides return no rows.</li>
          <li>Writes the policy blocks return a permission error and this state.</li>
          <li>Ask an admin to grant the role, then open the page again.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/data">Open data</Link>
          </Button>
        </div>
      </Card>
    </>
  );
}
