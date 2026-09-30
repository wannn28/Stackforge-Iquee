import type { Member, MemberRole, MemberStatus, RecordStatus, TableRecord } from "@/lib/types";

export const RECORD_STATUSES = new Set<RecordStatus>(["open", "in_progress", "done", "archived"]);
export const MEMBER_ROLES = new Set<MemberRole>(["owner", "admin", "member"]);
export const MEMBER_STATUSES = new Set<MemberStatus>(["active", "invited", "suspended"]);

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asTimestamp(value: unknown) {
  return asString(value) ?? new Date(0).toISOString();
}

export function mapRecord(
  row: unknown,
  ownerNames?: ReadonlyMap<string, string>,
): TableRecord | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  const id = asString(value.id);
  const title = asString(value.title);
  if (!id || !title) return null;

  const statusValue = asString(value.status);
  const status = RECORD_STATUSES.has(statusValue as RecordStatus)
    ? (statusValue as RecordStatus)
    : "open";
  const ownerId = asString(value.owner_id);
  const ownerLabel = (ownerId && ownerNames?.get(ownerId)) || ownerId || "—";

  return {
    id,
    title,
    status,
    ownerId,
    ownerLabel,
    createdAt: asTimestamp(value.created_at),
    updatedAt: asTimestamp(value.updated_at),
  };
}

export function mapMember(row: unknown): Member | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  const id = asString(value.id);
  if (!id) return null;

  const email = asString(value.email) ?? "";
  const fullName = asString(value.full_name) || email || "—";
  const roleValue = asString(value.role)?.toLowerCase() ?? "member";
  const statusValue = asString(value.status)?.toLowerCase() ?? "active";

  return {
    id,
    email,
    fullName,
    role: MEMBER_ROLES.has(roleValue as MemberRole) ? (roleValue as MemberRole) : "member",
    status: MEMBER_STATUSES.has(statusValue as MemberStatus)
      ? (statusValue as MemberStatus)
      : "active",
    createdAt: asTimestamp(value.created_at),
    updatedAt: asTimestamp(value.updated_at),
  };
}
