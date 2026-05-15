import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { documentIds } = (await req.json()) as { documentIds: string[] };

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return NextResponse.json({ error: "documentIds required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documentContext = await fetchDocumentContext(supabase, user.id, documentIds, 40000);
  if (!documentContext) return NextResponse.json({ conditions: [], patientName: null });

  const prompt = `You are a medical expert reviewing patient documents. Extract two things:

1. PATIENT NAME — the full name of the patient these documents belong to. Look for name fields at the top of letters, prescription labels, test result headers, discharge summaries, etc. Return null if you cannot find a clear patient name.

2. CONDITIONS — ONLY the primary, formally diagnosed medical conditions.

Medical documents:
${documentContext}

CONDITIONS rules:
INCLUDE:
- Named diseases and conditions that a doctor has formally diagnosed (e.g. "Type 2 Diabetes", "Atrial Fibrillation", "Crohn's Disease")
- Conditions explicitly stated as a current diagnosis or confirmed medical history

EXCLUDE — do not include any of these:
- Symptoms or side effects (e.g. fatigue, nausea, headache, shortness of breath, pain)
- Secondary complications of a primary condition
- Risk factors or predispositions
- Medications, treatments, or procedures
- Lab findings or test results
- Suspected, possible, or ruled-out conditions

Return ONLY a JSON object with exactly this shape (no other text):
{"patientName": "Full Name" | null, "conditions": ["Condition 1", "Condition 2"]}

Maximum 8 conditions. Avoid duplicates.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(text);

    return NextResponse.json({
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions : [],
      patientName: typeof parsed.patientName === "string" && parsed.patientName.trim() ? parsed.patientName.trim() : null,
    });
  } catch {
    return NextResponse.json({ conditions: [], patientName: null });
  }
}
