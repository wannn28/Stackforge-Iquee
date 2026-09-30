import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-6 text-h1 text-foreground">Page not found</h1>
        <p className="mt-2 text-body text-muted">That path is not part of Stackforge.</p>
        <Button className="mt-6" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
