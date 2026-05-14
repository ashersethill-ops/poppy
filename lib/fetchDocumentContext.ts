import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches extracted text for a set of document IDs server-side.
 * Always scoped to the authenticated user — never exposes other users' data.
 * Returns a formatted string ready to inject into a Claude prompt.
 */
export async function fetchDocumentContext(
  supabase: SupabaseClient,
  userId: string,
  documentIds: string[],
  maxChars = 40000
): Promise<string> {
  if (!documentIds?.length) return "";

  const { data } = await supabase
    .from("documents")
    .select("name, extracted_text")
    .in("id", documentIds)
    .eq("user_id", userId); // ownership enforced here + by RLS

  if (!data?.length) return "";

  return data
    .map((d) => `=== ${d.name} ===\n${d.extracted_text ?? ""}`)
    .join("\n\n")
    .slice(0, maxChars);
}
