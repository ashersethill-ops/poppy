import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";
import Anthropic from "@anthropic-ai/sdk";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Verify consent using the simple has_patient_consent function
  const { data: hasConsent, error: consentError } = await supabase
    .rpc("has_patient_consent", { p_patient_id: patientId });

  if (consentError || !hasConsent) {
    return NextResponse.json({ error: "You do not have access to this patient." }, { status: 403 });
  }

  // 2. Fetch patient profile via RLS ("Doctors read patient profiles" policy)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, is_custodian, conditions, date_of_birth, email")
    .eq("id", patientId)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // 3. Resolve display name — use profile.name; carer_name is the profile name when is_custodian
  const resolvedProfile = {
    ...profile,
    name: profile?.name ?? null,
    carer_name: profile?.is_custodian ? profile?.name : null,
    is_custodian: profile?.is_custodian ?? false,
  };

  // 4. Patient documents via RLS ("Doctors read patient documents" policy)
  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, size_bytes, uploaded_at")
    .eq("user_id", patientId)
    .order("uploaded_at", { ascending: false });

  // 5. Generate AI overview
  const conditions: string[] = profile?.conditions ?? [];
  const docIds = (documents ?? []).map((d: { id: string }) => d.id);
  const documentContext = docIds.length
    ? await fetchDocumentContext(supabase, patientId, docIds, 40000)
    : "";

  let overview = null;
  if (conditions.length > 0 || documentContext) {
    try {
      const patientContext = [
        conditions.length ? `Diagnosed conditions: ${conditions.join(", ")}.` : "",
        documentContext ? `\nMedical documents:\n${documentContext}` : "",
      ].filter(Boolean).join("\n");

      const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

      const message = await claude.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: `You are a medical AI assistant building a clinical summary for a doctor reviewing their patient's case.

Today's date: ${today}

Patient profile:
${patientContext}

Generate a structured clinical summary. Return ONLY valid JSON (no markdown):
{
  "timeline": [{"date": "...", "event": "...", "type": "diagnosis|treatment|test|milestone"}],
  "diagnoses": [{"condition": "...", "description": "...", "diagnosedDate": "..."}],
  "treatments": [{"name": "...", "type": "medication|therapy|procedure", "dose": "...", "frequency": "...", "since": "..."}],
  "physicians": [{"name": "...", "specialty": "...", "hospital": "...", "phone": "...", "email": "..."}],
  "research": [{"title": "...", "source": "...", "year": "...", "relevance": "..."}]
}

Rules:
- timeline: chronological, max 10 events, always end with today as "milestone"
- diagnoses: plain clinical language, one per condition
- treatments: only those found in documents; omit unknown fields
- physicians: only those actually named in documents
- research: 4-5 relevant recent papers`,
        }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
      const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      overview = JSON.parse(text);
    } catch {
      // overview stays null
    }
  }

  return NextResponse.json({ profile: resolvedProfile, documents: documents ?? [], overview });
}
