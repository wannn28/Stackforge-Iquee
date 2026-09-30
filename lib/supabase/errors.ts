export type QueryError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

export type FailureReason = "forbidden" | "missing" | "error";

export function classifySupabaseError(error: QueryError): {
  reason: FailureReason;
  message: string;
} {
  const code = error.code ?? "";
  const message = error.message?.trim() || "Request failed";
  const blob = `${message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    code === "42501" ||
    blob.includes("row-level security") ||
    blob.includes("permission denied") ||
    blob.includes("not authorized")
  ) {
    return { reason: "forbidden", message };
  }

  if (
    code === "42P01" ||
    code === "PGRST205" ||
    code === "PGRST204" ||
    blob.includes("does not exist") ||
    blob.includes("schema cache") ||
    blob.includes("could not find the table")
  ) {
    return { reason: "missing", message };
  }

  return { reason: "error", message };
}
