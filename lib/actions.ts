"use server";

import { revalidatePath } from "next/cache";
import { classifySupabaseError } from "@/lib/supabase/errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/types";

export type ActionResult =
  | { ok: true }
  | { ok: false; reason: "forbidden" | "error"; message: string };

async function mutate(
  table: "records" | "profiles",
  id: string,
  values: Record<string, string>,
  path: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: true };

  const supabase = await createClient();
  const { error } = await supabase.from(table).update(values).eq("id", id);

  if (error) {
    const classified = classifySupabaseError(error);
    if (classified.reason === "missing") {
      return { ok: false, reason: "error", message: "That table is not available yet." };
    }
    if (classified.reason === "forbidden") {
      return { ok: false, reason: "forbidden", message: classified.message };
    }
    return { ok: false, reason: "error", message: classified.message };
  }

  revalidatePath(path);
  return { ok: true };
}

export async function archiveRecord(id: string): Promise<ActionResult> {
  return mutate("records", id, { status: "archived" }, "/data");
}

export async function updateMemberRole(id: string, role: MemberRole): Promise<ActionResult> {
  return mutate("profiles", id, { role }, "/users");
}

export async function updateProfileName(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { ok: false, reason: "error", message: "Name must be at least 2 characters." };
  }

  if (!isSupabaseConfigured()) return { ok: true };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
  if (error) {
    return { ok: false, reason: "error", message: error.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}
