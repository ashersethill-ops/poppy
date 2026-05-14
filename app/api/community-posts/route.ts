import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type SocialPost = {
  platform: "Reddit" | "Community";
  subreddit?: string;
  author: string;
  title: string;
  excerpt: string;
  score?: number;
  numComments?: number;
  url?: string;
  condition: string;
  timeAgo?: string;
};

async function fetchRedditPosts(conditions: string[]): Promise<SocialPost[]> {
  const query = conditions.map((c) => `"${c}"`).join(" OR ") + " personal experience support";
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=top&t=year&limit=12&type=link&nsfw=false`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Poppy Health App/1.0" },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) throw new Error(`Reddit ${res.status}`);

  const data = await res.json();
  const posts: SocialPost[] = [];

  for (const child of data.data?.children ?? []) {
    const p = child.data;
    if (p.over_18 || !p.subreddit) continue;
    const condition = conditions.find((c) =>
      [p.title, p.selftext, p.subreddit].some((s) =>
        s?.toLowerCase().includes(c.toLowerCase())
      )
    ) ?? conditions[0];

    posts.push({
      platform: "Reddit",
      subreddit: p.subreddit,
      author: p.author,
      title: p.title,
      excerpt: (p.selftext || p.title).slice(0, 320).trim(),
      score: p.score,
      numComments: p.num_comments,
      url: `https://www.reddit.com${p.permalink}`,
      condition,
      timeAgo: formatTimeAgo(p.created_utc),
    });
  }

  return posts.slice(0, 6);
}

function formatTimeAgo(utcSeconds: number): string {
  const diff = Date.now() / 1000 - utcSeconds;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.round(diff / 86400)}d ago`;
  return `${Math.round(diff / 2592000)}mo ago`;
}

async function generateFallbackPosts(conditions: string[]): Promise<SocialPost[]> {
  const prompt = `You are generating realistic, representative social media posts from patient support communities for a health app demo.

Conditions: ${conditions.join(", ")}

Generate 6 realistic posts that could have been written by real patients in Reddit or HealthUnlocked communities about living with these conditions. They should sound genuine, human, and emotionally real — capturing the kinds of things patients actually share: day-to-day struggles, breakthroughs, questions, support. Mix tones: some venting, some hopeful, some asking for advice.

Return ONLY valid JSON (no markdown):
{
  "posts": [
    {
      "subreddit": "diabetes2",
      "author": "user_handle_here",
      "title": "Finally figured out what was spiking my blood sugar...",
      "excerpt": "After months of tracking I realised it was the oat milk in my morning coffee. Switched to unsweetened almond and my readings dropped significantly. Anyone else had something surprising like this?",
      "score": 847,
      "numComments": 134,
      "condition": "Type 2 Diabetes",
      "timeAgo": "3d ago"
    }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const data = JSON.parse(text);

  return (data.posts ?? []).map((p: Omit<SocialPost, "platform">) => ({
    ...p,
    platform: "Community" as const,
  }));
}

export async function POST(req: NextRequest) {
  const { conditions } = await req.json();
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return NextResponse.json({ error: "conditions required" }, { status: 400 });
  }

  try {
    const posts = await fetchRedditPosts(conditions);
    if (posts.length >= 3) {
      return NextResponse.json({ posts, source: "reddit" });
    }
    throw new Error("Too few Reddit results");
  } catch {
    // Fall back to Claude-generated representative posts
    try {
      const posts = await generateFallbackPosts(conditions);
      return NextResponse.json({ posts, source: "generated" });
    } catch (err: unknown) {
      const error = err as { message?: string };
      return NextResponse.json({ error: error.message ?? "Failed" }, { status: 500 });
    }
  }
}
