import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTENT_TYPE = "financial";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conditions, documentIds, insuranceDocIds, forceRefresh } = body;

  const hasConditions    = Array.isArray(conditions)      && conditions.length > 0;
  const hasDocuments     = Array.isArray(documentIds)     && documentIds.length > 0;
  const hasInsuranceDocs = Array.isArray(insuranceDocIds) && insuranceDocIds.length > 0;

  if (!hasConditions && !hasDocuments && !hasInsuranceDocs) {
    return NextResponse.json({ error: "conditions or documents required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Serve from cache ───────────────────────────────────────────────────────
  if (!forceRefresh) {
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
  const { data: newCredits } = await supabase.rpc("decrement_credits", { uid: user.id });
  if (newCredits === -1) {
    return NextResponse.json({ error: "No AI credits remaining." }, { status: 402 });
  }
  const remainingCredits = newCredits as number;

  // ── Fetch document contexts ────────────────────────────────────────────────
  let medicalContext = "";
  if (hasDocuments) {
    medicalContext = await fetchDocumentContext(supabase, user.id, documentIds, 15000);
  }

  let insuranceContext = "";
  if (hasInsuranceDocs) {
    const { data: insDocs } = await supabase
      .from("insurance_documents")
      .select("name, extracted_text")
      .in("id", insuranceDocIds)
      .eq("user_id", user.id);

    if (insDocs?.length) {
      insuranceContext = insDocs
        .map((d) => `=== ${d.name} ===\n${d.extracted_text ?? ""}`)
        .join("\n\n")
        .slice(0, 15000);
    }
  }

  const prompt = `You are a US healthcare financial advisor helping a patient reduce the economic burden of managing their condition(s).

Patient profile:
${hasConditions ? `Diagnosed conditions: ${conditions.slice(0, 6).join(", ")}.` : "Conditions not specified."}
${medicalContext ? `\nMedical records:\n${medicalContext}` : ""}
${insuranceContext ? `\nInsurance policy documents:\n${insuranceContext}` : "No insurance documents uploaded."}

Provide personalised, actionable US-focused financial guidance. Be specific and practical — mention real programmes, real plan types, real cost-saving strategies relevant to their conditions.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "policyAnalysis": ${hasInsuranceDocs ? `{
    "summary": "2-3 sentence plain-language summary of their current policy coverage",
    "deductible": "e.g. $2,500 individual",
    "outOfPocketMax": "e.g. $7,000 individual",
    "conditionCoverage": "How well their specific condition(s) are covered under this plan",
    "gaps": ["Coverage gap or concern 1", "Coverage gap or concern 2"],
    "keyPoints": ["Key policy point 1", "Key policy point 2", "Key policy point 3"]
  }` : "null"},
  "betterPlans": [
    {
      "name": "Plan name or type (e.g. Silver HMO via marketplace)",
      "type": "HMO | PPO | EPO | HDHP | Medicare Advantage",
      "why": "1-2 sentence explanation of why this plan type suits their condition(s) better",
      "estimatedAnnualSaving": "e.g. ~$1,200/year vs average plan"
    }
  ],
  "costTips": [
    {
      "category": "Category label (e.g. Patient Assistance, Generic Drugs, HSA/FSA, Charity Care, Prior Auth, Copay Card)",
      "tip": "Specific actionable advice in plain language",
      "potentialSaving": "e.g. Up to $400/month on medication"
    }
  ]
}

Rules:
- betterPlans: 3–5 realistic recommendations tailored to their condition(s)
- costTips: 5–8 specific, actionable tips — mention real programme names where applicable (e.g. NeedyMeds, RxAssist, manufacturer patient assistance programmes)
- Plain language throughout, no jargon
- All advice must be US-specific`;

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
    await supabase.from("ai_content_cache").upsert({
      user_id:      user.id,
      content_type: CONTENT_TYPE,
      content:      data,
      conditions:   conditions ?? [],
      generated_at: now,
    });

    return NextResponse.json({ ...data, cachedAt: now, remainingCredits });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message ?? "API error" }, { status: error.status ?? 500 });
  }
}
