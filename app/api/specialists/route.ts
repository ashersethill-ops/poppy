import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTENT_TYPE = "specialists";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conditions, documentIds, forceRefresh, location } = body;

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
    location ? `Patient's location: ${location}.` : "",
    documentContext ? `\nMedical documents:\n${documentContext}` : "",
  ].filter(Boolean).join("\n");

  const locationInstruction = location
    ? `For each category: generate 2 specialists who practice in or near ${location} (nearLocation: true) and 1 international specialist who offers online consultations to patients globally (nearLocation: false).`
    : `Spread across UK, US, Canada, Australia. Set nearLocation: false for all.`;

  const prompt = `You are generating a fictional but realistic specialist directory for a patient health app.

Patient profile:
${patientContext}

Generate exactly 9 fictional but realistic specialists across three categories, tailored to this specific patient.

Categories and counts:
- "physician": 3 specialists (doctors, surgeons, specialist physicians directly treating the conditions)
- "mental_support": 3 specialists (psychologists, psychiatrists, counsellors, social workers, therapists — supporting the emotional and psychological side of living with the conditions)
- "complementary": 3 specialists (physiotherapists, occupational therapists, nutritionists, acupuncturists, osteopaths, or other evidence-based complementary practitioners)

${locationInstruction}

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "specialists": [
    {
      "name": "Dr. Sarah Mitchell",
      "title": "MD, FRCP",
      "specialty": "Cardiologist",
      "subspecialty": "Heart Failure & Transplant",
      "category": "physician",
      "bio": "One concise sentence describing this specialist's clinical focus and key strength.",
      "whyContact": "One sentence explaining why this specific patient should reach out, referencing their conditions or documents. Write directly to the patient.",
      "hospital": "Royal Brompton Hospital",
      "city": "London",
      "country": "UK",
      "email": "s.mitchell@royalbrompton.nhs.uk",
      "phone": "+44 20 7352 8121",
      "gender": "female",
      "portraitIndex": 23,
      "acceptingPatients": true,
      "nearLocation": true
    }
  ]
}

Rules:
- Exactly 9 specialists: 3 physician, 3 mental_support, 3 complementary
- category must be exactly one of: "physician", "mental_support", "complementary"
- gender must be "male" or "female"
- portraitIndex must be a unique integer between 1 and 49
- Mix male and female across the list
- nearLocation: true = specialist is near the patient's location; false = international expert offering online consultations
- Realistic fictional contact details
- bio: one sentence only — crisp and informative
- whyContact: one sentence only — genuinely personalised to this patient's conditions/documents`;

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
