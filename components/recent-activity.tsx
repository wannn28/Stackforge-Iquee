import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { recordStatusLabel, type RecordStatus, type TableRecord } from "@/lib/types";

const statusTone: Record<RecordStatus, "primary" | "warning" | "success" | "muted"> = {
  open: "primary",
  in_progress: "warning",
  done: "success",
  archived: "muted",
};

function RecentActivity({ records }: { records: TableRecord[] }) {
  const recent = [...records]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 5);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-h2 text-foreground">Recent activity</h2>
          <p className="text-caption text-muted">Latest updates in this workspace</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/data">View data</Link>
        </Button>
      </div>
      {recent.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-h2 text-foreground">No activity yet</p>
          <p className="mt-1 text-body text-muted">Add a record and updates will show up here.</p>
          <Button className="mt-4" asChild>
            <Link href="/data">Add a record</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {recent.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-body font-medium text-foreground">{record.title}</p>
                <p className="truncate text-caption text-muted">
                  {record.ownerLabel} · {formatDate(record.updatedAt)}
                </p>
              </div>
              <Badge className="shrink-0" tone={statusTone[record.status]}>
                {recordStatusLabel[record.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export { RecentActivity };
