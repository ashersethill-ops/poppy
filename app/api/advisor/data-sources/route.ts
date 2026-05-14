import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

// Increase timeout for agentic loops (Vercel: set maxDuration in vercel.json)
export const maxDuration = 120;

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Auth helper ────────────────────────────────────────────────────────────────

async function requireAdvisor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", supabase, user: null };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!["health_advisor", "master_admin"].includes(profile?.role ?? "")) {
    return { error: "Forbidden", supabase, user: null };
  }
  return { error: null, supabase, user };
}

// ── Tool definitions ───────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_clinical_trials",
    description:
      "Search ClinicalTrials.gov for real clinical trials by condition. Returns recruiting and active trials with full protocol details including contacts, eligibility, sponsor, and locations.",
    input_schema: {
      type: "object" as const,
      properties: {
        condition: { type: "string", description: "Medical condition to search (e.g. 'rheumatoid arthritis')" },
        max_results: { type: "number", description: "Number of results to return (default 8, max 15)" },
      },
      required: ["condition"],
    },
  },
  {
    name: "search_pubmed",
    description:
      "Search PubMed for peer-reviewed medical articles. Returns real titles, authors, journals, and abstracts. Use patient-friendly search terms to find accessible reviews and guidelines.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "PubMed search query (e.g. 'rheumatoid arthritis patient guide review')" },
        max_results: { type: "number", description: "Number of results (default 8)" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_reddit_communities",
    description:
      "Search Reddit for real patient support communities (subreddits) related to a health condition. Returns subreddit name, description, subscriber count, and URL.",
    input_schema: {
      type: "object" as const,
      properties: {
        condition: { type: "string", description: "Medical condition or related term to search for" },
      },
      required: ["condition"],
    },
  },
  {
    name: "search_physician_registry",
    description:
      "Search the US National Provider Identifier (NPI) registry for real licensed physicians by specialty. Returns real names, credentials, practice locations, and phone numbers.",
    input_schema: {
      type: "object" as const,
      properties: {
        taxonomy: {
          type: "string",
          description:
            "Medical specialty taxonomy to search (e.g. 'rheumatology', 'cardiology', 'neurology', 'oncology'). Use the primary specialty that treats this condition.",
        },
        limit: { type: "number", description: "Number of results (default 8)" },
      },
      required: ["taxonomy"],
    },
  },
];

// ── Tool execution ─────────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const timeout = (ms: number) => AbortSignal.timeout(ms);

  try {
    // ── ClinicalTrials.gov v2 ────────────────────────────────────────────────
    if (name === "search_clinical_trials") {
      const condition = input.condition as string;
      const max = Math.min((input.max_results as number) ?? 8, 15);
      const url =
        `https://clinicaltrials.gov/api/v2/studies` +
        `?query.cond=${encodeURIComponent(condition)}` +
        `&filter.overallStatus=RECRUITING,ACTIVE_NOT_RECRUITING` +
        `&pageSize=${max}` +
        `&format=json`;

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: timeout(10000),
      });
      if (!res.ok) return `ClinicalTrials API error: ${res.status}`;
      const data = await res.json();

      // Slim down the response to the fields the agent needs
      const studies = (data.studies ?? []).map((s: Record<string, Record<string, unknown>>) => {
        const id = s.protocolSection;
        if (!id) return null;
        const ident = id.identificationModule as Record<string, unknown> ?? {};
        const status = id.statusModule as Record<string, unknown> ?? {};
        const design = id.designModule as Record<string, unknown> ?? {};
        const desc = id.descriptionModule as Record<string, unknown> ?? {};
        const elig = id.eligibilityModule as Record<string, unknown> ?? {};
        const contacts = id.contactsLocationsModule as Record<string, unknown> ?? {};
        const sponsor = id.sponsorCollaboratorsModule as Record<string, unknown> ?? {};

        const centralContacts = (contacts.centralContacts as Record<string, unknown>[] ?? []);
        const locations = (contacts.locations as Record<string, unknown>[] ?? []);

        return {
          nctId: ident.nctId,
          title: ident.briefTitle,
          status: status.overallStatus,
          phases: design.phases,
          sponsor: (sponsor.leadSponsor as Record<string, unknown>)?.name,
          summary: desc.briefSummary,
          eligibility: elig.eligibilityCriteria,
          minAge: elig.minimumAge,
          maxAge: elig.maximumAge,
          contact: centralContacts[0],
          location: locations[0],
          url: `https://clinicaltrials.gov/study/${ident.nctId}`,
        };
      }).filter(Boolean);

      return JSON.stringify(studies).slice(0, 10000);
    }

    // ── PubMed E-utilities ───────────────────────────────────────────────────
    if (name === "search_pubmed") {
      const query = input.query as string;
      const max = Math.min((input.max_results as number) ?? 8, 12);
      const ncbiBase = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
      const toolParam = "tool=poppy-health&email=support%40poppyhealth.app";

      // Step 1: search for IDs
      const searchRes = await fetch(
        `${ncbiBase}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${max}&retmode=json&sort=relevance&${toolParam}`,
        { signal: timeout(8000) }
      );
      if (!searchRes.ok) return `PubMed search error: ${searchRes.status}`;
      const searchData = await searchRes.json();
      const ids: string[] = searchData.esearchresult?.idlist ?? [];
      if (ids.length === 0) return "No PubMed results found for this query.";

      // Step 2: fetch abstracts as plain text
      const fetchRes = await fetch(
        `${ncbiBase}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=text&${toolParam}`,
        { signal: timeout(10000) }
      );
      if (!fetchRes.ok) return `PubMed fetch error: ${fetchRes.status}`;
      const text = await fetchRes.text();
      return text.slice(0, 9000);
    }

    // ── Reddit community search ──────────────────────────────────────────────
    if (name === "search_reddit_communities") {
      const condition = input.condition as string;
      // Use the public .json endpoint (no OAuth required)
      const res = await fetch(
        `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(condition)}&limit=20&sort=relevance`,
        {
          headers: { "User-Agent": "poppy-health/1.0 (patient support platform)" },
          signal: timeout(8000),
        }
      );
      if (!res.ok) return `Reddit API error: ${res.status} — try a broader condition name`;
      const data = await res.json();

      const communities = (data.data?.children ?? [])
        .map((c: { data: Record<string, unknown> }) => ({
          display_name: c.data.display_name,
          display_name_prefixed: c.data.display_name_prefixed,
          title: c.data.title,
          public_description: c.data.public_description,
          subscribers: c.data.subscribers,
          url: `https://www.reddit.com${c.data.url}`,
          over18: c.data.over18,
          lang: c.data.lang,
        }))
        .filter((c: Record<string, unknown>) => !c.over18);

      return JSON.stringify(communities).slice(0, 6000);
    }

    // ── NPI physician registry ───────────────────────────────────────────────
    if (name === "search_physician_registry") {
      const taxonomy = input.taxonomy as string;
      const limit = Math.min((input.limit as number) ?? 8, 15);
      const res = await fetch(
        `https://npiregistry.cms.hhs.gov/api/?version=2.1&taxonomy_description=${encodeURIComponent(taxonomy)}&enumeration_type=NPI-1&limit=${limit}`,
        { signal: timeout(8000) }
      );
      if (!res.ok) return `NPI Registry error: ${res.status}`;
      const data = await res.json();

      const physicians = (data.results ?? []).map((r: Record<string, unknown>) => {
        const basic = r.basic as Record<string, unknown> ?? {};
        const addresses = r.addresses as Record<string, unknown>[] ?? [];
        const taxonomies = r.taxonomies as Record<string, unknown>[] ?? [];
        const location = addresses.find((a) => a.address_purpose === "LOCATION") ?? addresses[0] ?? {};
        const primaryTax = taxonomies.find((t) => t.primary) ?? taxonomies[0] ?? {};

        return {
          npi: r.number,
          firstName: basic.first_name,
          lastName: basic.last_name,
          credential: basic.credential,
          gender: basic.gender, // "M" or "F"
          specialty: primaryTax.desc,
          address: location.address_1,
          city: location.city,
          state: location.state,
          phone: location.telephone_number,
        };
      });

      return JSON.stringify(physicians).slice(0, 6000);
    }

    return `Unknown tool: ${name}`;
  } catch (err) {
    return `Tool error (${name}): ${(err as Error).message}`;
  }
}

// ── Agentic generation loop ────────────────────────────────────────────────────

interface GeneratedData {
  specialists: Record<string, unknown>[];
  articles: Record<string, unknown>[];
  trials: Record<string, unknown>[];
  communities: Record<string, unknown>[];
}

async function runDataSourceAgent(condition: string): Promise<GeneratedData> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `You are a medical data researcher. Your task is to find REAL, verifiable data for patients with "${condition}" using the available tools.

Step 1 — Gather data by calling all four tools:
- search_clinical_trials("${condition}") — find recruiting/active trials
- search_pubmed("${condition} patient review treatment guidelines") — find patient-relevant articles
- search_reddit_communities("${condition}") — find real support communities
- search_physician_registry(the correct medical specialty for "${condition}") — find real US physicians

Step 2 — Filter the raw data by these rules:
- Trials: Keep only RECRUITING or ACTIVE_NOT_RECRUITING. Must have a contact or sponsor. Max 3 trials. Use the real NCT URL (https://clinicaltrials.gov/study/NCTXXXXXX).
- Articles: Select 3 most recent and patient-relevant. Exclude purely lab/animal studies. Write a plain-language summary and 4–5 key points based on the real abstract.
- Communities: Keep only subreddits with >500 subscribers that are health-related and not age-restricted. Select top 4.
- Specialists: Pick 4 real physicians from NPI results. For each, construct a realistic bio based on their specialty and location. Add a plausible institutional email (firstname.lastname@[institution].edu or nhs.uk). Set portraitIndex to a unique integer 1–49 based on their gender (M→male portrait, F→female portrait). Set acceptingPatients to true for 2–3 of them.

IMPORTANT: If any tool returns an error or no results, do NOT stop — continue with the other tools and use your medical knowledge to fill gaps. Always return a complete JSON object with the required number of items in each array.

Step 3 — Return ONLY a valid JSON object (no markdown, no explanation):
{
  "specialists": [
    {
      "name": "Dr. Jane Smith",
      "title": "MD",
      "specialty": "Rheumatology",
      "subspecialty": "Inflammatory Arthritis",
      "bio": "2–3 sentence bio based on real specialty and location.",
      "hospital": "Massachusetts General Hospital",
      "city": "Boston",
      "country": "USA",
      "email": "j.smith@mgh.harvard.edu",
      "phone": "+1 617-555-0100",
      "gender": "female",
      "portraitIndex": 12,
      "acceptingPatients": true
    }
  ],
  "articles": [
    {
      "condition": "${condition}",
      "title": "Real article title from PubMed",
      "summary": "Plain-language 2–3 sentence summary of the real abstract.",
      "keyPoints": ["Key finding 1", "Key finding 2", "Key finding 3", "Key finding 4"],
      "readingTime": "4 min read",
      "pmid": "12345678",
      "source": "Journal Name, Year"
    }
  ],
  "trials": [
    {
      "condition": "${condition}",
      "title": "Real trial title from ClinicalTrials.gov",
      "phase": "Phase 3",
      "status": "Recruiting",
      "location": "Multiple sites, USA",
      "sponsor": "Real sponsor name",
      "description": "2–3 sentence plain-language description.",
      "eligibility": "Key eligibility criteria in plain language.",
      "contact": "trials@sponsor.org",
      "website": "https://clinicaltrials.gov/study/NCTXXXXXXXX",
      "eligibility_match": "likely_eligible",
      "eligibility_reason": "Most adults with this condition meet the standard criteria."
    }
  ],
  "communities": [
    {
      "platform": "Reddit",
      "name": "r/ExampleSubreddit",
      "condition": "${condition}",
      "description": "Real subreddit description.",
      "members": "45k members",
      "url": "https://www.reddit.com/r/ExampleSubreddit/",
      "tone": "Peer support, daily tips"
    }
  ]
}`,
    },
  ];

  const MAX_ITERATIONS = 12;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      tools: TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      if (!textBlock) throw new Error("Agent returned no text");

      const raw = textBlock.text;
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("Agent returned no JSON");

      return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      // Run all tool calls in parallel
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const result = await executeTool(block.name, block.input as Record<string, unknown>);
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: result,
          };
        })
      );

      messages.push({
        role: "user",
        content: toolResults,
      });
    }
  }

  throw new Error("Agent did not complete within the iteration limit");
}

// ── Route handlers ─────────────────────────────────────────────────────────────

// GET — all data sources for a condition (advisor view, all statuses)
export async function GET(req: NextRequest) {
  const { error, supabase } = await requireAdvisor();
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const condition = req.nextUrl.searchParams.get("condition");
  if (!condition) return NextResponse.json({ error: "condition required" }, { status: 400 });

  const { data, error: dbError } = await supabase
    .from("condition_data_sources")
    .select("*")
    .eq("condition_name", condition)
    .order("source_type")
    .order("generated_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ sources: data ?? [] });
}

// POST — run the data-scraping agent and store results as pending
export async function POST(req: NextRequest) {
  const { error, supabase, user } = await requireAdvisor();
  if (error || !user) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { condition_name } = await req.json();
  if (!condition_name) return NextResponse.json({ error: "condition_name required" }, { status: 400 });

  // Remove existing pending items — keep approved/rejected as a history
  await supabase
    .from("condition_data_sources")
    .delete()
    .eq("condition_name", condition_name)
    .eq("status", "pending");

  let generated: GeneratedData;
  try {
    generated = await runDataSourceAgent(condition_name);
  } catch (err) {
    return NextResponse.json({ error: `Agent failed: ${(err as Error).message}` }, { status: 500 });
  }

  const rows = [
    ...(generated.specialists ?? []).map((s) => ({
      condition_name,
      source_type: "specialist",
      title: s.name as string,
      subtitle: [s.specialty, s.subspecialty].filter(Boolean).join(" · ") as string,
      data: s,
    })),
    ...(generated.articles ?? []).map((a) => ({
      condition_name,
      source_type: "article",
      title: a.title as string,
      subtitle: [a.source, a.readingTime].filter(Boolean).join(" · ") as string,
      data: a,
    })),
    ...(generated.trials ?? []).map((t) => ({
      condition_name,
      source_type: "trial",
      title: t.title as string,
      subtitle: `${t.phase} · ${t.status}`,
      data: t,
    })),
    ...(generated.communities ?? []).map((c) => ({
      condition_name,
      source_type: "community",
      title: c.name as string,
      subtitle: c.platform as string,
      data: c,
    })),
  ];

  const { error: insertError } = await supabase
    .from("condition_data_sources")
    .insert(rows);

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const { data: sources } = await supabase
    .from("condition_data_sources")
    .select("*")
    .eq("condition_name", condition_name)
    .order("source_type")
    .order("generated_at", { ascending: false });

  return NextResponse.json({ sources: sources ?? [] });
}

// PATCH — approve or reject an item
export async function PATCH(req: NextRequest) {
  const { error, supabase, user } = await requireAdvisor();
  if (error || !user) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { id, status, rejection_reason } = await req.json();
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("condition_data_sources")
    .update({
      status,
      rejection_reason: rejection_reason ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
