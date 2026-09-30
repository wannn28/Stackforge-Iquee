const PLACEHOLDER_HOSTS = new Set([
  "placeholder.supabase.co",
  "your-project.supabase.co",
  "example.supabase.co",
]);

export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

/**
 * Public browser config only. SUPABASE_SERVICE_ROLE_KEY is server-only and
 * must never be read here or prefixed with NEXT_PUBLIC_.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) return null;
  if (anonKey === "your-anon-key" || anonKey.includes("public-anon-key")) return null;

  try {
    const host = new URL(url).host;
    if (PLACEHOLDER_HOSTS.has(host)) return null;
  } catch {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv() !== null;
}

/** Local shell preview. Production builds inline NODE_ENV and ignore this flag. */
export function isPreviewMode() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.STACKFORGE_PREVIEW === "1" &&
    !isSupabaseConfigured()
  );
}
