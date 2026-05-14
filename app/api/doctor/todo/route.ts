import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all patients for this doctor
  const { data: patients, error } = await supabase.rpc("get_my_patients");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!patients || patients.length === 0) {
    return NextResponse.json({ todos: [] });
  }

  // Fetch document counts per patient
  const patientIds = patients.map((p: { patient_id: string }) => p.patient_id);
  const { data: docs } = await supabase
    .from("documents")
    .select("user_id, uploaded_at")
    .in("user_id", patientIds)
    .order("uploaded_at", { ascending: false });

  // Build a summary for Claude
  const patientSummaries = patients.map((p: {
    patient_name: string | null;
    patient_conditions: string[] | null;
    granted_at: string;
    is_custodian: boolean;
    carer_name: string | null;
    patient_id: string;
  }) => {
    const patientDocs = (docs ?? []).filter((d: { user_id: string }) => d.user_id === p.patient_id);
    const recentDoc = patientDocs[0];
    const daysSinceConsent = Math.floor(
      (Date.now() - new Date(p.granted_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceDoc = recentDoc
      ? Math.floor((Date.now() - new Date(recentDoc.uploaded_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return [
      `Patient: ${p.patient_name ?? "Unnamed"}`,
      p.is_custodian && p.carer_name ? `  Carer: ${p.carer_name}` : "",
      `  Conditions: ${p.patient_conditions?.join(", ") || "none listed"}`,
      `  Documents: ${patientDocs.length} uploaded`,
      daysSinceDoc !== null ? `  Last document: ${daysSinceDoc} days ago` : "  No documents yet",
      `  Access granted: ${daysSinceConsent} days ago`,
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  try {
    const message = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are a clinical assistant helping a doctor manage their patient caseload.

Today: ${today}

Patient summary:
${patientSummaries}

Generate a practical to-do list for this doctor. Return ONLY valid JSON:
{
  "todos": [
    {
      "priority": "high" | "medium" | "low",
      "patient": "patient name or null if general",
      "action": "short action title (max 8 words)",
      "detail": "1-2 sentence explanation of why this matters",
      "category": "documents" | "review" | "follow-up" | "general"
    }
  ]
}

Rules:
- Max 8 todos total
- Order by priority (high first)
- Focus on: reviewing patient documents, following up on conditions, checking trial eligibility, reviewing recent uploads
- If a patient has no documents, suggest asking them to upload records
- If conditions are complex or multiple, suggest a full case review
- Keep actions specific and actionable`,
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const { todos } = JSON.parse(text);
    return NextResponse.json({ todos: todos ?? [] });
  } catch {
    return NextResponse.json({ todos: [] });
  }
}
