"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function ForbiddenState({
  message = "Row-level security blocked this request.",
}: {
  message?: string;
}) {
  return (
    <Card className="p-6">
      <p className="text-caption font-medium text-danger">Access denied</p>
      <h1 className="mt-2 text-h1 text-foreground">You don&apos;t have access</h1>
      <p className="mt-2 max-w-xl text-body text-muted">
        Your account is signed in, but this read was rejected. {message} Ask an admin to grant
        this role access, then retry.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/forbidden">Review access</Link>
        </Button>
      </div>
    </Card>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="p-6">
      <p className="text-caption font-medium text-warning">Couldn&apos;t load</p>
      <h1 className="mt-2 text-h1 text-foreground">This view didn&apos;t load</h1>
      <p className="mt-2 max-w-xl text-body text-muted">{message}</p>
      {onRetry ? (
        <Button className="mt-6" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

function SampleNotice({ table }: { table: string }) {
  return (
    <p className="mb-4 rounded-md border border-border bg-surface px-3 py-2 text-caption text-muted shadow-card">
      Sample data. The <span className="font-medium text-foreground">{table}</span> table is not
      available to this session yet. Live rows replace this view when the table exists and the
      signed-in role can read it.
    </p>
  );
}

export { ErrorState, ForbiddenState, SampleNotice };
