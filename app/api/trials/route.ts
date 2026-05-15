import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTENT_TYPE = "trials";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conditions, documentIds, forceRefresh } = body;

  const hasConditions = Array.isArray(conditions) && conditions.length > 0;
  const hasDocuments  = Array.isArray(documentIds) && documentIds.length > 0;

  if (!hasConditions && !hasDocuments) {
    return NextResponse.json({ error: "conditions or documentIds required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Advisor-approved data takes priority (no credits, no cache) ────────────
  if (hasConditions) {
    const { data: existing } = await supabase
      .from("condition_data_sources")
      .select("condition_name, data, status")
      .in("condition_name", conditions)
      .eq("source_type", "trial");

    if (existing && existing.length > 0) {
      const approved = existing.filter((r) => r.status === "approved").map((r) => r.data);
      return NextResponse.json({ trials: approved });
    }
  }

  // ── Serve from cache if not forcing a refresh ──────────────────────────────
  if (!forceRefresh && user) {
    const { data: cached } = await supabase
      .from("ai_content_cache")
      .select("content, generated_at")
      .eq("user_id", user.id)
      .eq("content_type", CONTENT_TYPE)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({ ...cached.content, cachedAt: cached.generated_at });
    }
  }

  // ── Deduct 1 credit before generating ─────────────────────────────────────
  let remainingCredits: number | undefined;
  if (user) {
    const { data: newCredits } = await supabase.rpc("decrement_credits", { uid: user.id });
    if (newCredits === -1) {
      return NextResponse.json({ error: "No AI credits remaining." }, { status: 402 });
    }
    remainingCredits = newCredits as number;
  }

  // ── Fetch document context ─────────────────────────────────────────────────
  let documentContext = "";
  if (hasDocuments && user) {
    documentContext = await fetchDocumentContext(supabase, user.id, documentIds, 30000);
  }

  const patientContext = [
    hasConditions ? `Diagnosed conditions: ${conditions.join(", ")}.` : "",
    documentContext ? `\nMedical documents:\n${documentContext}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are generating a fictional but realistic clinical trial directory for a patient health app.

Patient profile:
${patientContext}

Generate 2-3 fictional but realistic clinical trials per condition (max 8 total). Use the patient's documents to match eligibility criteria as closely as possible to their actual profile — age indicators, lab values, medication history, disease stage — so each trial feels genuinely relevant to this specific patient.

After defining each trial's eligibility criteria, carefully assess whether this specific patient meets them based on everything you know about their profile. Be honest: if they clearly meet the criteria mark them eligible, if they likely meet them but some details are uncertain mark them likely_eligible, if they do not meet one or more key criteria mark them not_eligible.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "trials": [
    {
      "condition": "Type 2 Diabetes",
      "title": "SUSTAIN-T2D: Novel GLP-1 Receptor Agonist in Treatment-Naive Patients",
      "phase": "Phase 3",
      "status": "Recruiting",
      "location": "Multiple sites across UK and Ireland",
      "sponsor": "University of Edinburgh / NHS Scotland",
      "description": "2-3 sentence description of what the trial is investigating.",
      "eligibility": "Adults aged 30-75 with newly diagnosed Type 2 Diabetes, HbA1c 7.5-10%.",
      "contact": "trials@ed.ac.uk",
      "website": "https://trials.ed.ac.uk/sustain-t2d",
      "eligibility_match": "eligible",
      "eligibility_reason": "Your HbA1c of 8.2% and recent diagnosis date fall within the required range for this trial."
    }
  ]
}

Rules:
- 2-3 trials per condition, max 8 total
- status must be one of: "Recruiting", "Active", or "Completed"
- phase must be "Phase 1", "Phase 2", "Phase 3", or "Phase 4"
- Mix of statuses and phases
- eligibility_match must be one of: "eligible", "likely_eligible", "not_eligible"
- eligibility_reason must be 1 concise sentence explaining why the patient does or does not meet the criteria, referencing their specific profile details where possible
- website must be a realistic fictional URL for the trial (e.g. https://trials.hospital.ac.uk/trial-id)
- Eligibility criteria should reflect what the patient's documents reveal about their profile`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw  = message.content[0].type === "text" ? message.content[0].text : "{}";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const data = JSON.parse(text);

    const now = new Date().toISOString();
    if (user) {
      await supabase.from("ai_content_cache").upsert({
        user_id:      user.id,
        content_type: CONTENT_TYPE,
        content:      data,
        conditions:   conditions ?? [],
        generated_at: now,
      });
    }

    return NextResponse.json({ ...data, cachedAt: now, remainingCredits });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message ?? "API error" }, { status: error.status ?? 500 });
  }
}
