import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTENT_TYPE = "specialists";

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

  // ── Advisor-approved data takes priority ───────────────────────────────────
  if (hasConditions) {
    const { data: existing } = await supabase
      .from("condition_data_sources")
      .select("condition_name, data, status")
      .in("condition_name", conditions)
      .eq("source_type", "specialist");

    if (existing && existing.length > 0) {
      const approved = existing.filter((r) => r.status === "approved").map((r) => r.data);
      return NextResponse.json({ specialists: approved });
    }
  }

  // ── Serve from cache ───────────────────────────────────────────────────────
  if (!forceRefresh && user) {
    const { data: cached, error: cacheErr } = await supabase
      .from("ai_content_cache")
      .select("content, generated_at")
      .eq("user_id", user.id)
      .eq("content_type", CONTENT_TYPE)
      .maybeSingle();
    if (cacheErr) console.error(`[${CONTENT_TYPE}] cache read error:`, cacheErr.message);

    if (cached) {
      return NextResponse.json({ ...cached.content, cachedAt: cached.generated_at });
    }
  }

  // ── Deduct 1 credit ────────────────────────────────────────────────────────
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

  const prompt = `You are generating a fictional but realistic medical specialist directory for a patient health app.

Patient profile:
${patientContext}

Generate exactly 8 fictional but realistic medical specialists who are most relevant to this specific patient — use their conditions AND any findings from their documents (test results, diagnoses, medications, specialist referrals) to select the most appropriate specialties.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "specialists": [
    {
      "name": "Dr. Sarah Mitchell",
      "title": "MD, FRCP",
      "specialty": "Cardiologist",
      "subspecialty": "Heart Failure & Transplant",
      "bio": "2-3 sentence professional profile of this specialist — their background, research focus, and clinical strengths.",
      "whyContact": "1-2 sentence personalised explanation of why THIS specific patient should consider contacting this specialist, referencing their actual conditions, test results, or medications where relevant. Write directly to the patient (use 'you' / 'your').",
      "hospital": "Royal Brompton Hospital",
      "city": "London",
      "country": "UK",
      "email": "s.mitchell@royalbrompton.nhs.uk",
      "phone": "+44 20 7352 8121",
      "gender": "female",
      "portraitIndex": 23,
      "acceptingPatients": true
    }
  ]
}

Rules:
- Exactly 8 specialists
- gender must be "male" or "female"
- portraitIndex must be a unique integer between 1 and 49
- Mix male and female (roughly 4 each)
- Spread across UK, US, Canada, Australia
- Realistic fictional contact details
- Specialties must match this patient's specific profile
- whyContact must be genuinely personalised — reference the patient's specific conditions, medications, or document findings, not generic reasons`;

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
