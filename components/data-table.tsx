"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { ForbiddenState } from "@/components/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { archiveRecord } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import type { RecordStatus, TableRecord } from "@/lib/types";

const PAGE_SIZE = 8;

const statusTone = {
  active: "success",
  draft: "warning",
  archived: "muted",
} as const;

const filters: Array<{ value: "all" | RecordStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

function DataTable({ rows }: { rows: TableRecord[] }) {
  const confirm = useConfirm();
  const [records, setRecords] = useState(rows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]["value"]>("all");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = status === "all" || record.status === status;
      const matchesQuery =
        needle.length === 0 ||
        record.name.toLowerCase().includes(needle) ||
        record.owner.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [records, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatus(value: (typeof filters)[number]["value"]) {
    setStatus(value);
    setPage(1);
  }

  async function onArchive(record: TableRecord) {
    const accepted = await confirm({
      title: "Archive this record?",
      description: `${record.name} will be marked archived.`,
      confirmLabel: "Archive",
      tone: "danger",
    });
    if (!accepted) return;

    setPendingId(record.id);
    const result = await archiveRecord(record.id);
    setPendingId(null);

    if (!result.ok) {
      if (result.reason === "forbidden") {
        setForbiddenMessage(result.message);
        return;
      }
      toast.error(result.message);
      return;
    }

    setRecords((current) =>
      current.map((item) => (item.id === record.id ? { ...item, status: "archived" } : item)),
    );
    toast.success("Record archived");
  }

  if (forbiddenMessage) {
    return <ForbiddenState message={forbiddenMessage} />;
  }

  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(start + PAGE_SIZE, filtered.length);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Search name or owner"
          aria-label="Search records"
          className="sm:flex-1"
        />
        <select
          value={status}
          onChange={(event) => updateStatus(event.target.value as (typeof filters)[number]["value"])}
          aria-label="Filter by status"
          className="h-10 rounded-md border border-border bg-surface px-3 text-body text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-40"
        >
          {filters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>
      <div className="max-h-[640px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow className="h-auto">
                <TableCell colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-h2 text-foreground">No records match</p>
                  <p className="mt-1 text-body text-muted">
                    {records.length === 0
                      ? "Nothing has been added yet."
                      : "Try a different search or status filter."}
                  </p>
                  {records.length > 0 ? (
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => {
                        updateQuery("");
                        updateStatus("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((record) => (
                <TableRow key={record.id} className="hover:bg-foreground/[0.03]">
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>
                    <Badge tone={statusTone[record.status]}>{record.status}</Badge>
                  </TableCell>
                  <TableCell>{record.owner}</TableCell>
                  <TableCell className="text-muted">{formatDate(record.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      disabled={record.status === "archived" || pendingId === record.id}
                      onClick={() => onArchive(record)}
                    >
                      {record.status === "archived" ? "Archived" : "Archive"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex h-12 items-center justify-between border-t border-border px-4">
        <p className="text-caption text-muted">
          Showing {from}–{to} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

export { DataTable };
