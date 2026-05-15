import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONTENT_TYPE = "communities";

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
      .eq("source_type", "community");

    if (existing && existing.length > 0) {
      const approved = existing.filter((r) => r.status === "approved").map((r) => r.data);
      return NextResponse.json({ communities: approved });
    }
  }

  // ── Serve from cache ───────────────────────────────────────────────────────
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
    documentContext = await fetchDocumentContext(supabase, user.id, documentIds, 20000);
  }

  const patientContext = [
    hasConditions ? `Diagnosed conditions: ${conditions.join(", ")}.` : "",
    documentContext ? `\nMedical documents:\n${documentContext}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are helping a patient find real online support communities relevant to their health conditions.

Patient profile:
${patientContext}

Generate a list of real, active online communities where this patient can connect with others who share their conditions. Include communities from multiple platforms.

IMPORTANT URL RULES:
- Reddit: Use format https://www.reddit.com/r/[subreddit]/ — only include subreddits you are highly confident exist (e.g. r/diabetes2, r/MultipleSclerosis, r/cancer, r/ChronicIllness)
- HealthUnlocked: Use format https://healthunlocked.com/[community] — these are real NHS-backed communities (e.g. healthunlocked.com/diabetes-uk, healthunlocked.com/nras)
- Inspire: Use format https://www.inspire.com/groups/[group]/ — real patient groups (e.g. inspire.com/groups/breast-cancer/)
- Facebook: Use https://www.facebook.com/search/groups/?q=[condition+support] as a search URL — do NOT invent specific group URLs
- PatientsLikeMe: Use https://www.patientslikeme.com/ for the platform link
- Crohn's & Colitis Foundation: https://www.crohnscolitisfoundation.org/
- Other patient advocacy or charity-run forums: use their real URLs

Return ONLY valid JSON (no markdown) in this exact format:
{
  "communities": [
    {
      "platform": "Reddit",
      "name": "r/diabetes2",
      "condition": "Type 2 Diabetes",
      "description": "A supportive community of over 120,000 people living with Type 2 Diabetes sharing experiences, tips, and research.",
      "members": "120k members",
      "url": "https://www.reddit.com/r/diabetes2/",
      "tone": "Peer support, daily life tips, research discussions"
    }
  ]
}

Rules:
- Generate 8–12 communities total across conditions
- platform must be one of: "Reddit", "Facebook", "HealthUnlocked", "Inspire", "PatientsLikeMe", "X", "Other"
- Spread across at least 3 different platforms
- Prioritise Reddit and HealthUnlocked as their URLs are most reliable
- members can be approximate (e.g. "45k members", "10k+ members") — omit if unknown
- tone: 3–6 word description of what the community is like
- Only include communities you are highly confident are real and active`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
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
