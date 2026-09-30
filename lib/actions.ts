"use server";

import { revalidatePath } from "next/cache";
import { mapRecord, MEMBER_ROLES, RECORD_STATUSES } from "@/lib/rows";
import { classifySupabaseError } from "@/lib/supabase/errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole, RecordStatus, TableRecord } from "@/lib/types";

const NOT_CONFIGURED = "Supabase is not configured. Nothing was saved.";

export type ActionResult =
  | { ok: true; record?: TableRecord }
  | { ok: false; reason: "forbidden" | "error"; error: string };

function fail(reason: "forbidden" | "error", error: string): ActionResult {
  return { ok: false, reason, error };
}

function fromSupabaseError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): ActionResult {
  const classified = classifySupabaseError(error);
  if (classified.reason === "missing") {
    return fail("error", "That table is not available yet.");
  }
  if (classified.reason === "forbidden") {
    return fail("forbidden", classified.message);
  }
  return fail("error", classified.message);
}

async function mutate(
  table: "records" | "profiles",
  id: string,
  values: Record<string, string>,
  path: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return fail("error", NOT_CONFIGURED);

  const supabase = await createClient();
  const { error } = await supabase.from(table).update(values).eq("id", id);
  if (error) return fromSupabaseError(error);

  revalidatePath(path);
  return { ok: true };
}

export async function archiveRecord(id: string): Promise<ActionResult> {
  return mutate("records", id, { status: "archived" }, "/data");
}

export async function updateMemberRole(id: string, role: MemberRole): Promise<ActionResult> {
  if (!MEMBER_ROLES.has(role)) return fail("error", "Choose a valid role.");
  return mutate("profiles", id, { role }, "/users");
}

export async function updateProfileName(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return fail("error", "Full name must be at least 2 characters.");
  if (!isSupabaseConfigured()) return fail("error", NOT_CONFIGURED);

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) return fail("error", "Sign in before saving your profile.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: trimmed })
    .eq("id", data.user.id);
  if (profileError) return fromSupabaseError(profileError);

  const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
  if (error) return fail("error", error.message);

  revalidatePath("/settings");
  return { ok: true };
}

export async function createRecord(input: { title: string; status: RecordStatus }): Promise<ActionResult> {
  const title = input.title.trim();
  if (!title) return fail("error", "Title is required.");
  if (!RECORD_STATUSES.has(input.status)) return fail("error", "Choose a valid status.");
  if (!isSupabaseConfigured()) return fail("error", NOT_CONFIGURED);

  const supabase = await createClient();
  const { data: auth, error: userError } = await supabase.auth.getUser();
  if (userError || !auth.user) return fail("error", "Sign in before adding a record.");

  const { data, error } = await supabase
    .from("records")
    .insert({ title, status: input.status, owner_id: auth.user.id })
    .select("id, title, status, owner_id, created_at, updated_at")
    .single();

  if (error) return fromSupabaseError(error);

  const metadata = auth.user.user_metadata as { full_name?: unknown } | undefined;
  const ownerLabel =
    typeof metadata?.full_name === "string" && metadata.full_name
      ? metadata.full_name
      : auth.user.email || "You";
  const record = mapRecord(data, new Map([[auth.user.id, ownerLabel]]));
  if (!record) return fail("error", "The record was saved but could not be read back.");

  revalidatePath("/data");
  revalidatePath("/dashboard");
  return { ok: true, record };
}
