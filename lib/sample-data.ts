import type { Kpi, Member, TableRecord } from "@/lib/types";

export const sampleRecords: TableRecord[] = [
  {
    id: "rec_edge_cache",
    name: "Edge cache policy",
    status: "active",
    owner: "Platform",
    updatedAt: "2026-09-28T14:10:00.000Z",
  },
  {
    id: "rec_auth_allowlist",
    name: "Auth callback allowlist",
    status: "active",
    owner: "Security",
    updatedAt: "2026-09-27T09:40:00.000Z",
  },
  {
    id: "rec_billing_export",
    name: "Billing export",
    status: "draft",
    owner: "Finance",
    updatedAt: "2026-09-26T16:05:00.000Z",
  },
  {
    id: "rec_region_pin",
    name: "Region pin — ap-southeast",
    status: "active",
    owner: "Platform",
    updatedAt: "2026-09-25T11:22:00.000Z",
  },
  {
    id: "rec_audit_sink",
    name: "Audit log sink",
    status: "archived",
    owner: "Security",
    updatedAt: "2026-09-22T08:15:00.000Z",
  },
  {
    id: "rec_invite_template",
    name: "Invite email template",
    status: "draft",
    owner: "Operations",
    updatedAt: "2026-09-21T13:48:00.000Z",
  },
  {
    id: "rec_quota_alert",
    name: "Quota alert rule",
    status: "active",
    owner: "Operations",
    updatedAt: "2026-09-20T10:02:00.000Z",
  },
  {
    id: "rec_dns_cutover",
    name: "DNS cutover checklist",
    status: "active",
    owner: "Platform",
    updatedAt: "2026-09-18T17:30:00.000Z",
  },
  {
    id: "rec_retention",
    name: "Retention window",
    status: "draft",
    owner: "Finance",
    updatedAt: "2026-09-16T12:11:00.000Z",
  },
  {
    id: "rec_status_page",
    name: "Status page component",
    status: "active",
    owner: "Operations",
    updatedAt: "2026-09-14T15:44:00.000Z",
  },
  {
    id: "rec_legacy_hook",
    name: "Legacy webhook",
    status: "archived",
    owner: "Platform",
    updatedAt: "2026-09-09T07:20:00.000Z",
  },
  {
    id: "rec_role_map",
    name: "Role map",
    status: "active",
    owner: "Security",
    updatedAt: "2026-09-04T19:05:00.000Z",
  },
];

export const sampleMembers: Member[] = [
  {
    id: "mem_admin",
    name: "Workspace admin",
    email: "admin@stackforge.iquee.tech",
    role: "admin",
    status: "active",
  },
  {
    id: "mem_ops",
    name: "Operations",
    email: "ops@stackforge.iquee.tech",
    role: "member",
    status: "active",
  },
  {
    id: "mem_platform",
    name: "Platform",
    email: "platform@stackforge.iquee.tech",
    role: "member",
    status: "active",
  },
  {
    id: "mem_finance",
    name: "Finance",
    email: "finance@stackforge.iquee.tech",
    role: "viewer",
    status: "active",
  },
  {
    id: "mem_security",
    name: "Security",
    email: "security@stackforge.iquee.tech",
    role: "admin",
    status: "invited",
  },
  {
    id: "mem_guest",
    name: "Guest access",
    email: "guest@stackforge.iquee.tech",
    role: "viewer",
    status: "suspended",
  },
];

export function kpisFromRecords(records: TableRecord[]): Kpi[] {
  const active = records.filter((record) => record.status === "active").length;
  const drafts = records.filter((record) => record.status === "draft").length;
  const archived = records.filter((record) => record.status === "archived").length;

  return [
    {
      id: "records",
      label: "Records",
      value: String(records.length),
      hint: "Visible to this role",
      tone: "default",
    },
    {
      id: "active",
      label: "Active",
      value: String(active),
      hint: "Currently in use",
      tone: "success",
    },
    {
      id: "drafts",
      label: "Drafts",
      value: String(drafts),
      hint: drafts > 0 ? "Awaiting review" : "Nothing waiting",
      tone: drafts > 0 ? "warning" : "default",
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
