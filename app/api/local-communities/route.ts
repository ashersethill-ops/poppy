import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CONTENT_TYPE = "local_communities";

export type LocalCommunity = {
  name: string;
  type: "charity" | "nhs" | "helpline" | "meetup" | "facebook";
  condition: string;
  description: string;
  url: string;
  isInPerson?: boolean;
};

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    conditions: string[];
    location: string;
    forceRefresh?: boolean;
  };

  const { conditions, location, forceRefresh } = body;

  if (!Array.isArray(conditions) || conditions.length === 0 || !location?.trim()) {
    return NextResponse.json({ error: "conditions and location required" }, { status: 400 });
  }

  const trimmedLocation = location.trim();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Serve from cache only if the saved location matches the requested location
  if (!forceRefresh) {
    const { data: cached, error: cacheErr } = await supabase
      .from("ai_content_cache")
      .select("content, generated_at")
      .eq("user_id", user.id)
      .eq("content_type", CONTENT_TYPE)
      .maybeSingle();
    if (cacheErr) console.error(`[${CONTENT_TYPE}] cache read error:`, cacheErr.message);

    if (cached && (cached.content as { usedLocation?: string })?.usedLocation === trimmedLocation) {
      return NextResponse.json({ ...cached.content, cachedAt: cached.generated_at });
    }
  }

  // Deduct 1 credit
  let remainingCredits: number | undefined;
  const { data: newCredits } = await supabase.rpc("decrement_credits", { uid: user.id });
  if (newCredits === -1) {
    return NextResponse.json({ error: "No AI credits remaining." }, { status: 402 });
  }
  remainingCredits = newCredits as number;

  const prompt = `You are helping a patient find in-person and locally-relevant patient support resources.

Patient conditions: ${conditions.join(", ")}
Patient location: ${trimmedLocation}

Find 6–8 real, trustworthy patient support resources relevant to this location. Include a mix of:
1. Major patient charities with local branches or group finders (e.g. Diabetes UK, British Heart Foundation, MS Society, Macmillan, Arthritis Action, Cancer Research UK, Crohn's & Colitis UK) — use their real "find local support" or branch locator URL
2. In-person group searches: pre-built Meetup.com search and Facebook group search links for the user's city + conditions
3. NHS patient groups or services if location is in the UK (use real NHS or condition charity URLs)
4. Condition-specific helplines with a phone number or contact URL

RULES:
- Only include real organisations you are highly confident exist
- For charities: use the real "find a group", "local support", or branch locator page URL — NOT the homepage
- Meetup search URL format: https://www.meetup.com/find/?keywords=${encodeURIComponent(conditions[0] + " support")}&location=${encodeURIComponent(trimmedLocation)}
- Facebook search URL format: https://www.facebook.com/groups/search?q=${encodeURIComponent(conditions[0] + " support " + trimmedLocation)}
- Do NOT invent specific local group names or URLs — link to search pages or national locators only
- type must be one of: "charity" | "nhs" | "helpline" | "meetup" | "facebook"
- isInPerson: true for in-person groups, false for online/helpline

Return ONLY valid JSON (no markdown):
{
  "communities": [
    {
      "name": "Diabetes UK – Find Your Local Group",
      "type": "charity",
      "condition": "Type 2 Diabetes",
      "description": "Diabetes UK volunteer-led groups meet regularly across the UK. Use their locator to find groups near ${trimmedLocation}.",
      "url": "https://www.diabetes.org.uk/support/local-groups",
      "isInPerson": true
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw  = message.content[0].type === "text" ? message.content[0].text : "{}";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(text) as { communities: LocalCommunity[] };

    const now = new Date().toISOString();
    const payload = { ...parsed, usedLocation: trimmedLocation };

    await supabase.from("ai_content_cache").upsert({
      user_id:      user.id,
      content_type: CONTENT_TYPE,
      content:      payload,
      conditions,
      generated_at: now,
    });

    return NextResponse.json({ ...payload, cachedAt: now, remainingCredits });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message ?? "API error" }, { status: error.status ?? 500 });
  }
}
