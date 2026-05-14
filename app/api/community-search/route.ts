import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type RedditResult = {
  title: string;
  excerpt: string;
  subreddit: string;
  score: number;
  url: string;
  numComments: number;
};

async function searchReddit(query: string, conditions: string[]): Promise<RedditResult[]> {
  const fullQuery = `${query} ${conditions.join(" ")}`;
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(fullQuery)}&sort=relevance&t=all&limit=8&type=link&nsfw=false`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Poppy Health App/1.0" },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) throw new Error(`Reddit ${res.status}`);

  const data = await res.json();
  return (data.data?.children ?? [])
    .filter((c: { data: { over_18: boolean } }) => !c.data.over_18)
    .map((c: { data: { title: string; selftext: string; subreddit: string; score: number; permalink: string; num_comments: number } }) => ({
      title: c.data.title,
      excerpt: (c.data.selftext || c.data.title).slice(0, 400),
      subreddit: c.data.subreddit,
      score: c.data.score,
      url: `https://www.reddit.com${c.data.permalink}`,
      numComments: c.data.num_comments,
    }))
    .slice(0, 6);
}

async function synthesiseAnswer(
  query: string,
  conditions: string[],
  sources: RedditResult[],
  usedRealData: boolean
): Promise<string> {
  const sourceContext = sources.length > 0
    ? sources.map((s, i) => `[${i + 1}] r/${s.subreddit}: "${s.title}"\n${s.excerpt}`).join("\n\n")
    : "";

  const prompt = `You are Poppy, a compassionate health companion helping a patient find community wisdom about their conditions.

Patient conditions: ${conditions.join(", ")}
Patient question: "${query}"

${usedRealData && sourceContext ? `Here are real posts from patient communities about this topic:\n\n${sourceContext}\n\n` : ""}

Write a warm, compassionate, and genuinely helpful response (3–5 paragraphs) that:
- Directly addresses the patient's question
- Reflects what patient communities commonly share and experience around this topic
- Is written in plain, human language — not clinical
- Acknowledges the emotional reality of what patients go through
- ${usedRealData && sourceContext ? "References insights from the community posts above" : "Draws on your knowledge of what patients with these conditions commonly discuss"}
- Ends with a brief encouragement to explore the linked communities for more peer support

Do not use headers or bullet points. Write in flowing paragraphs.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

export async function POST(req: NextRequest) {
  const { query, conditions } = await req.json();
  if (!query || !Array.isArray(conditions)) {
    return NextResponse.json({ error: "query and conditions required" }, { status: 400 });
  }

  let sources: RedditResult[] = [];
  let usedRealData = false;

  try {
    sources = await searchReddit(query, conditions);
    usedRealData = sources.length > 0;
  } catch {
    // Reddit unavailable — continue with Claude-only answer
  }

  try {
    const answer = await synthesiseAnswer(query, conditions, sources, usedRealData);
    return NextResponse.json({ answer, sources, usedRealData });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: 500 });
  }
}
