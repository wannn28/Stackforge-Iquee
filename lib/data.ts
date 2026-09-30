import "server-only";
import { cache } from "react";
import { kpisFromRecords, sampleMembers, sampleRecords } from "@/lib/sample-data";
import { classifySupabaseError } from "@/lib/supabase/errors";
import { isPreviewMode, isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Kpi,
  LoadResult,
  Member,
  MemberRole,
  MemberStatus,
  RecordStatus,
  SessionUser,
  TableRecord,
} from "@/lib/types";

const RECORD_STATUSES = new Set<RecordStatus>(["active", "draft", "archived"]);
const MEMBER_ROLES = new Set<MemberRole>(["admin", "member", "viewer"]);
const MEMBER_STATUSES = new Set<MemberStatus>(["active", "invited", "suspended"]);

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function mapRecord(row: unknown): TableRecord | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  const id = asString(value.id);
  const name = asString(value.name) ?? asString(value.title);
  if (!id || !name) return null;

  const statusValue = asString(value.status);
  const status = RECORD_STATUSES.has(statusValue as RecordStatus)
    ? (statusValue as RecordStatus)
    : "draft";
  const owner = asString(value.owner) ?? asString(value.owner_name) ?? "—";
  const updatedAt = asString(value.updated_at) ?? asString(value.updatedAt) ?? new Date(0).toISOString();

  return { id, name, status, owner, updatedAt };
}

function mapMember(row: unknown): Member | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  const id = asString(value.id);
  const email = asString(value.email) ?? "—";
  const name = asString(value.full_name) ?? asString(value.name) ?? email;
  if (!id || !name) return null;

  const roleValue = asString(value.role)?.toLowerCase() ?? "member";
  const statusValue = asString(value.status)?.toLowerCase() ?? "active";

  return {
    id,
    name,
    email,
    role: MEMBER_ROLES.has(roleValue as MemberRole) ? (roleValue as MemberRole) : "member",
    status: MEMBER_STATUSES.has(statusValue as MemberStatus)
      ? (statusValue as MemberStatus)
      : "active",
  };
}

async function loadTable<T>(
  table: "records" | "profiles",
  mapRow: (row: unknown) => T | null,
  sample: T[],
): Promise<LoadResult<T[]>> {
  if (!isSupabaseConfigured()) {
    return { status: "ready", data: sample, source: "sample" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select("*").limit(200);

  if (error) {
    const classified = classifySupabaseError(error);
    if (classified.reason === "forbidden") {
      return { status: "forbidden", message: classified.message };
    }
    if (classified.reason === "missing") {
      return { status: "ready", data: sample, source: "sample" };
    }
    return { status: "error", message: classified.message };
  }

  const rows = (data ?? []).map(mapRow).filter((row): row is T => row !== null);
  return { status: "ready", data: rows, source: "live" };
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isPreviewMode()) {
    return {
      id: "preview",
      email: "preview@stackforge.iquee.tech",
      name: "Preview user",
    };
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const metadata = data.user.user_metadata as { full_name?: unknown; name?: unknown } | undefined;
  const nameFromMetadata =
    typeof metadata?.full_name === "string"
      ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : null;

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name: nameFromMetadata || data.user.email || "Account",
  };
});

export async function getRecords(): Promise<LoadResult<TableRecord[]>> {
  return loadTable("records", mapRecord, sampleRecords);
}

export async function getMembers(): Promise<LoadResult<Member[]>> {
  return loadTable("profiles", mapMember, sampleMembers);
}

export async function getDashboardKpis(): Promise<LoadResult<Kpi[]>> {
  const records = await getRecords();
  if (records.status !== "ready") return records;
  return {
    status: "ready",
    source: records.source,
    data: kpisFromRecords(records.data),
  };
}
