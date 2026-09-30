import "server-only";
import { cache } from "react";
import { kpisFromRecords, sampleMembers, sampleRecords } from "@/lib/sample-data";
import { mapMember, mapRecord } from "@/lib/rows";
import { classifySupabaseError } from "@/lib/supabase/errors";
import { isPreviewMode, isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Kpi, LoadResult, Member, SessionUser, TableRecord } from "@/lib/types";

const RECORD_COLUMNS = "id, title, status, owner_id, created_at, updated_at";
const PROFILE_COLUMNS = "id, email, full_name, role, status, created_at, updated_at";

function failure<T>(error: { code?: string; message?: string; details?: string | null; hint?: string | null }, sample: T): LoadResult<T> | null {
  const classified = classifySupabaseError(error);
  if (classified.reason === "forbidden") {
    return { status: "forbidden", message: classified.message };
  }
  if (classified.reason === "missing") {
    return { status: "ready", data: sample, source: "sample" };
  }
  return { status: "error", message: classified.message };
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
  if (!isSupabaseConfigured()) {
    return { status: "ready", data: sampleRecords, source: "sample" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select(RECORD_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    const result = failure(error, sampleRecords);
    if (result) return result;
  }

  const ownerIds = [
    ...new Set(
      (data ?? [])
        .map((row) => {
          const ownerId = (row as { owner_id?: unknown }).owner_id;
          return typeof ownerId === "string" ? ownerId : null;
        })
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const ownerNames = new Map<string, string>();
  if (ownerIds.length > 0) {
    const profiles = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
    if (!profiles.error) {
      for (const profile of profiles.data ?? []) {
        const id = typeof profile.id === "string" ? profile.id : null;
        if (!id) continue;
        const fullName = typeof profile.full_name === "string" ? profile.full_name : "";
        const email = typeof profile.email === "string" ? profile.email : "";
        ownerNames.set(id, fullName || email || id);
      }
    }
  }

  const rows = (data ?? [])
    .map((row) => mapRecord(row, ownerNames))
    .filter((row): row is TableRecord => row !== null);

  return { status: "ready", data: rows, source: "live" };
}

export async function getMembers(): Promise<LoadResult<Member[]>> {
  if (!isSupabaseConfigured()) {
    return { status: "ready", data: sampleMembers, source: "sample" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    const result = failure(error, sampleMembers);
    if (result) return result;
  }

  const rows = (data ?? []).map(mapMember).filter((row): row is Member => row !== null);
  return { status: "ready", data: rows, source: "live" };
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
