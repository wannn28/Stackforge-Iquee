import { cn } from "@/lib/utils";

function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-caption font-semibold text-white">
        S
      </span>
      {compact ? null : (
        <span className="text-h2 font-semibold text-foreground">Stackforge</span>
      )}
    </div>
  );
}

export { Logo };
