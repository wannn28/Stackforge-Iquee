import type { Kpi, Member, RecordStatus, TableRecord } from "@/lib/types";

const created = "2026-09-01T12:00:00.000Z";

export const sampleMembers: Member[] = [
  {
    id: "mem_owner",
    fullName: "Workspace owner",
    email: "owner@stackforge.iquee.tech",
    role: "owner",
    status: "active",
    createdAt: created,
    updatedAt: "2026-09-28T14:10:00.000Z",
  },
  {
    id: "mem_admin",
    fullName: "Workspace admin",
    email: "admin@stackforge.iquee.tech",
    role: "admin",
    status: "active",
    createdAt: created,
    updatedAt: "2026-09-27T09:40:00.000Z",
  },
  {
    id: "mem_ops",
    fullName: "Operations",
    email: "ops@stackforge.iquee.tech",
    role: "member",
    status: "active",
    createdAt: created,
    updatedAt: "2026-09-26T16:05:00.000Z",
  },
  {
    id: "mem_platform",
    fullName: "Platform",
    email: "platform@stackforge.iquee.tech",
    role: "member",
    status: "invited",
    createdAt: created,
    updatedAt: "2026-09-21T13:48:00.000Z",
  },
  {
    id: "mem_finance",
    fullName: "Finance",
    email: "finance@stackforge.iquee.tech",
    role: "member",
    status: "active",
    createdAt: created,
    updatedAt: "2026-09-16T12:11:00.000Z",
  },
  {
    id: "mem_security",
    fullName: "Security",
    email: "security@stackforge.iquee.tech",
    role: "admin",
    status: "suspended",
    createdAt: created,
    updatedAt: "2026-09-09T07:20:00.000Z",
  },
];

const ownerName = new Map(sampleMembers.map((member) => [member.id, member.fullName]));

function record(
  id: string,
  title: string,
  status: RecordStatus,
  ownerId: string,
  updatedAt: string,
): TableRecord {
  return {
    id,
    title,
    status,
    ownerId,
    ownerLabel: ownerName.get(ownerId) ?? ownerId,
    createdAt: created,
    updatedAt,
  };
}

export const sampleRecords: TableRecord[] = [
  record("rec_edge_cache", "Edge cache policy", "open", "mem_platform", "2026-09-28T14:10:00.000Z"),
  record("rec_auth_allowlist", "Auth callback allowlist", "in_progress", "mem_security", "2026-09-27T09:40:00.000Z"),
  record("rec_billing_export", "Billing export", "open", "mem_finance", "2026-09-26T16:05:00.000Z"),
  record("rec_region_pin", "Region pin — ap-southeast", "done", "mem_platform", "2026-09-25T11:22:00.000Z"),
  record("rec_audit_sink", "Audit log sink", "archived", "mem_security", "2026-09-22T08:15:00.000Z"),
  record("rec_invite_template", "Invite email template", "in_progress", "mem_ops", "2026-09-21T13:48:00.000Z"),
  record("rec_quota_alert", "Quota alert rule", "open", "mem_ops", "2026-09-20T10:02:00.000Z"),
  record("rec_dns_cutover", "DNS cutover checklist", "done", "mem_owner", "2026-09-18T17:30:00.000Z"),
  record("rec_retention", "Retention window", "in_progress", "mem_finance", "2026-09-16T12:11:00.000Z"),
  record("rec_status_page", "Status page component", "done", "mem_ops", "2026-09-14T15:44:00.000Z"),
  record("rec_legacy_hook", "Legacy webhook", "archived", "mem_platform", "2026-09-09T07:20:00.000Z"),
  record("rec_role_map", "Role map", "open", "mem_admin", "2026-09-04T19:05:00.000Z"),
];

export function kpisFromRecords(records: TableRecord[]): Kpi[] {
  const count = (status: RecordStatus) => records.filter((record) => record.status === status).length;
  const open = count("open");
  const inProgress = count("in_progress");
  const done = count("done");
  const archived = count("archived");

  return [
    {
      id: "open",
      label: "Open",
      value: String(open),
      hint: "Not started",
      tone: "default",
    },
    {
      id: "in_progress",
      label: "In progress",
      value: String(inProgress),
      hint: inProgress > 0 ? "Being worked on" : "Nothing in progress",
      tone: inProgress > 0 ? "warning" : "default",
    },
    {
      id: "done",
      label: "Done",
      value: String(done),
      hint: "Finished",
      tone: "success",
    },
    {
      id: "archived",
      label: "Archived",
      value: String(archived),
      hint: "Closed records",
      tone: "default",
    },
  ];
}
