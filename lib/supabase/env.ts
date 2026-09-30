const PLACEHOLDER_HOSTS = new Set([
  "placeholder.supabase.co",
  "your-project.supabase.co",
  "example.supabase.co",
]);

/** Retired host. It does not resolve and must not be used. */
const RETIRED_HOSTS = new Set(["moqlrespnizjxnybdcc.supabase.co"]);

/** Production project. The anon JWT `ref` claim must equal this value. */
export const STACKFORGE_SUPABASE_REF = "rnoglrespnizjxnybdcc";

export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

function projectRefFromUrl(url: string) {
  try {
    const { host } = new URL(url);
    if (PLACEHOLDER_HOSTS.has(host) || RETIRED_HOSTS.has(host)) return null;
    const [ref, ...rest] = host.split(".");
    if (!ref || rest.join(".") !== "supabase.co") return null;
    return ref;
  } catch {
    return null;
  }
}

/** Reads the `ref` claim from a Supabase anon JWT. Returns null when the key is not a JWT. */
export function anonKeyProjectRef(anonKey: string) {
  const segment = anonKey.split(".")[1];
  if (!segment) return null;
  try {
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
    const payload = JSON.parse(json) as { ref?: unknown };
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

/**
 * Public browser config only. SUPABASE_SERVICE_ROLE_KEY is server-only and
 * must never be read here or prefixed with NEXT_PUBLIC_.
 * A JWT whose `ref` does not match the project in NEXT_PUBLIC_SUPABASE_URL is ignored.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) return null;
  if (anonKey === "your-anon-key" || anonKey.includes("public-anon-key")) return null;

  const projectRef = projectRefFromUrl(url);
  if (!projectRef) return null;

  const keyRef = anonKeyProjectRef(anonKey);
  if (keyRef && keyRef !== projectRef) return null;

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
