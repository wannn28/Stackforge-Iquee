export type RecordStatus = "active" | "draft" | "archived";
export type MemberRole = "admin" | "member" | "viewer";
export type MemberStatus = "active" | "invited" | "suspended";
export type DataSource = "live" | "sample";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type TableRecord = {
  id: string;
  name: string;
  status: RecordStatus;
  owner: string;
  updatedAt: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
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
