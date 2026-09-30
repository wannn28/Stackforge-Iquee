export type RecordStatus = "open" | "in_progress" | "done" | "archived";
export type MemberRole = "owner" | "admin" | "member";
export type MemberStatus = "active" | "invited" | "suspended";
export type DataSource = "live" | "sample";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

/** Row from `records`. `ownerLabel` is display text for `ownerId`, not a column. */
export type TableRecord = {
  id: string;
  title: string;
  status: RecordStatus;
  ownerId: string | null;
  ownerLabel: string;
  createdAt: string;
  updatedAt: string;
};

/** Row from `profiles`. */
export type Member = {
  id: string;
  email: string;
  fullName: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
};

export type KpiTone = "default" | "success" | "warning" | "danger";

export type Kpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: KpiTone;
};

export type LoadResult<T> =
  | { status: "ready"; data: T; source: DataSource }
  | { status: "forbidden"; message: string }
  | { status: "error"; message: string };

export const recordStatusLabel: Record<RecordStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  archived: "Archived",
};

export const memberRoleLabel: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export const memberStatusLabel: Record<MemberStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};
