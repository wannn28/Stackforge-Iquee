"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="p-6">
      <h1 className="text-h1 text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-xl text-body text-muted">
        This page could not be loaded. Retry the request. If it keeps failing, check the Supabase
        logs for a policy or schema error.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
