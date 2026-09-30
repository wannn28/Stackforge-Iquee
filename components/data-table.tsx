"use client";

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { ForbiddenState } from "@/components/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { archiveRecord, createRecord } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { recordStatusLabel, type RecordStatus, type TableRecord } from "@/lib/types";

const PAGE_SIZE = 8;

const statusTone = {
  open: "primary",
  in_progress: "warning",
  done: "success",
  archived: "muted",
} as const;

const filters: Array<{ value: "all" | RecordStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "open", label: recordStatusLabel.open },
  { value: "in_progress", label: recordStatusLabel.in_progress },
  { value: "done", label: recordStatusLabel.done },
  { value: "archived", label: recordStatusLabel.archived },
];

const statuses = filters.filter((filter) => filter.value !== "all") as Array<{
  value: RecordStatus;
  label: string;
}>;

function DataTable({ rows }: { rows: TableRecord[] }) {
  const confirm = useConfirm();
  const [records, setRecords] = useState(rows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]["value"]>("all");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [draftStatus, setDraftStatus] = useState<RecordStatus>("open");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = status === "all" || record.status === status;
      const matchesQuery =
        needle.length === 0 ||
        record.title.toLowerCase().includes(needle) ||
        record.ownerLabel.toLowerCase().includes(needle);
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

  function clearFilters() {
    updateQuery("");
    updateStatus("all");
  }

  async function onArchive(record: TableRecord) {
    const accepted = await confirm({
      title: "Archive this record?",
      description: `${record.title} will be marked archived.`,
      confirmLabel: "Archive",
      tone: "danger",
    });
    if (!accepted) return;

    setPendingId(record.id);
    const result = await archiveRecord(record.id);
    setPendingId(null);

    if (!result.ok) {
      if (result.reason === "forbidden") {
        setForbiddenMessage(result.error);
        return;
      }
      toast.error(result.error);
      return;
    }

    setRecords((current) =>
      current.map((item) => (item.id === record.id ? { ...item, status: "archived" } : item)),
    );
    toast.success("Record archived");
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const result = await createRecord({ title, status: draftStatus });
    setSaving(false);

    if (!result.ok) {
      if (result.reason === "forbidden") {
        setAddOpen(false);
        setForbiddenMessage(result.error);
        return;
      }
      toast.error(result.error);
      return;
    }

    if (result.record) {
      setRecords((current) => [result.record!, ...current.filter((item) => item.id !== result.record?.id)]);
    }
    setTitle("");
    setDraftStatus("open");
    setAddOpen(false);
    setPage(1);
    toast.success("Record added");
  }

  if (forbiddenMessage) {
    return <ForbiddenState message={forbiddenMessage} />;
  }

  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(start + PAGE_SIZE, filtered.length);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search title or owner"
            aria-label="Search records"
            className="sm:flex-1"
          />
          <Select value={status} onValueChange={(value) => updateStatus(value as (typeof filters)[number]["value"])}>
            <SelectTrigger aria-label="Filter by status" className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setAddOpen(true)}>
            Add record
          </Button>
        </div>
        <div className="max-h-[640px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
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
                    <p className="text-h2 text-foreground">
                      {records.length === 0 ? "No records yet" : "No records match"}
                    </p>
                    <p className="mt-1 text-body text-muted">
                      {records.length === 0
                        ? "Add a record to start the workspace list."
                        : "Try a different search or status, or add a record."}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <Button type="button" onClick={() => setAddOpen(true)}>
                        Add record
                      </Button>
                      {records.length > 0 ? (
                        <Button type="button" variant="outline" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((record) => (
                  <TableRow key={record.id} className="hover:bg-foreground/[0.03]">
                    <TableCell className="font-medium">{record.title}</TableCell>
                    <TableCell>
                      <Badge tone={statusTone[record.status]}>{recordStatusLabel[record.status]}</Badge>
                    </TableCell>
                    <TableCell>{record.ownerLabel}</TableCell>
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
        <div className="flex h-12 items-center justify-between gap-3 border-t border-border px-4">
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

      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>Add record</DialogTitle>
          <DialogDescription>Title and status are saved on the records table.</DialogDescription>
          <form className="mt-4 flex flex-col gap-4" onSubmit={onCreate}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="record-title">Title</Label>
              <Input
                id="record-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="record-status">Status</Label>
              <Select value={draftStatus} onValueChange={(value) => setDraftStatus(value as RecordStatus)}>
                <SelectTrigger id="record-status" aria-label="Record status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? "Saving…" : "Add record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog.Root>
    </>
  );
}

export { DataTable };
