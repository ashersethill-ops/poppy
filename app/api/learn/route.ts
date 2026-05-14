import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { conditions, documentIds } = await req.json();

  const hasConditions = Array.isArray(conditions) && conditions.length > 0;
  const hasDocuments = Array.isArray(documentIds) && documentIds.length > 0;

  if (!hasConditions && !hasDocuments) {
    return NextResponse.json({ error: "conditions or documentIds required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Enforcement: if advisor has generated content for any of these conditions,
  // only return approved items — unverified data cannot be used on the platform.
  if (hasConditions) {
    const { data: existing } = await supabase
      .from("condition_data_sources")
      .select("condition_name, data, status")
      .in("condition_name", conditions)
      .eq("source_type", "article");

    if (existing && existing.length > 0) {
      const approved = existing.filter((r) => r.status === "approved").map((r) => r.data);
      return NextResponse.json({ articles: approved });
    }
  }

  // Fetch document text server-side
  let documentContext = "";
  if (hasDocuments) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      documentContext = await fetchDocumentContext(supabase, user.id, documentIds, 30000);
    }
  }

  const patientContext = [
    hasConditions ? `Diagnosed conditions: ${conditions.slice(0, 6).join(", ")}.` : "",
    documentContext ? `\nMedical documents:\n${documentContext}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are a compassionate medical educator writing for patients, not doctors.

Patient profile:
${patientContext}

Generate educational articles personalised to this specific patient. If medical documents are provided, reference their actual test results, medication names, or findings where relevant to make the content feel directly relevant to them. Write in plain, warm, accessible language.

Generate one article per condition (max 6 total). If documents reveal additional relevant topics beyond the listed conditions, you may add an article for those too.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "articles": [
    {
      "condition": "Type 2 Diabetes",
      "title": "Understanding Type 2 Diabetes: What It Means for You",
      "summary": "2-3 sentence plain-language summary personalised to this patient's situation.",
      "keyPoints": [
        "Key point one in plain language",
        "Key point two in plain language",
        "Key point three in plain language",
        "Key point four in plain language"
      ],
      "readingTime": "3 min read"
    }
  ]
}

Rules:
- Plain language, no jargon (explain any medical terms)
- Warm, reassuring tone
- 4-5 key points per article
- Where possible, tie content to the patient's actual documents and results`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message ?? "API error" }, { status: error.status ?? 500 });
  }
}
