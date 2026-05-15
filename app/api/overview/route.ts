import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTENT_TYPE = "overview";

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
    documentContext = await fetchDocumentContext(supabase, user.id, documentIds, 40000);
  }

  const patientContext = [
    hasConditions ? `Diagnosed conditions: ${conditions.join(", ")}.` : "",
    documentContext ? `\nMedical documents:\n${documentContext}` : "",
  ].filter(Boolean).join("\n");

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const prompt = `You are a medical AI assistant building a personalised health dashboard for a patient. Extract and generate structured data from the patient's profile and documents.

Today's date: ${today}

Patient profile:
${patientContext}

Generate a comprehensive medical summary. If certain information is not present in the documents, make reasonable inferences based on the conditions, or leave that section empty. Do not invent specific dates that are not in the documents.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "timeline": [
    {
      "date": "March 2021",
      "event": "Diagnosed with Type 2 Diabetes",
      "type": "diagnosis"
    }
  ],
  "diagnoses": [
    {
      "condition": "Type 2 Diabetes",
      "description": "A 2-3 sentence plain-language description of this condition as it relates to this patient.",
      "diagnosedDate": "March 2021"
    }
  ],
  "treatments": [
    {
      "name": "Metformin",
      "type": "medication",
      "dose": "500mg",
      "frequency": "Twice daily",
      "since": "April 2021"
    }
  ],
  "physicians": [
    {
      "name": "Dr. Sarah Collins",
      "specialty": "Endocrinologist",
      "hospital": "St. Mary's Hospital",
      "phone": "+44 20 7234 5678",
      "email": "s.collins@stmarys.nhs.uk"
    }
  ],
  "research": [
    {
      "title": "Headline of the research paper or article",
      "source": "Journal or publication name",
      "year": "2024",
      "relevance": "One sentence explaining why this is relevant to this patient."
    }
  ]
}

Rules:
- timeline: chronological events from earliest known date to today ("${today}"). Always include today as the final event with type "milestone" and event "Today". Include: diagnosis dates, medication starts, key test results, procedures. type must be one of: "diagnosis", "treatment", "test", "milestone". Max 10 events.
- diagnoses: one entry per condition. Plain, warm, non-jargon language. If diagnosedDate is unknown, omit that field.
- treatments: all current medications and therapies found in documents. type must be "medication", "therapy", or "procedure". Omit dose/frequency/since if unknown.
- physicians: only include physicians actually named in the documents. If none found, return empty array.
- research: generate 4-5 real or realistic recent research headlines that are highly relevant to this patient's specific conditions and treatment. Include the year (2023 or 2024 preferred).`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw  = message.content[0].type === "text" ? message.content[0].text : "{}";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const data = JSON.parse(text);

    // ── Save to cache ──────────────────────────────────────────────────────────
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
