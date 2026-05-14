import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { documentText, documentIds, conditions, question } = await req.json();

  if (!question) {
    return NextResponse.json({ error: "Missing question." }, { status: 400 });
  }

  let contextBlock = "";

  if (Array.isArray(documentIds) && documentIds.length > 0) {
    // Server-side fetch: extracted text never travels over the wire from the client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("documents")
      .select("name, extracted_text")
      .in("id", documentIds)
      .eq("user_id", user.id); // RLS double-fence: only this user's documents

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (data && data.length > 0) {
      const combined = data
        .map((d) => `--- Document: ${d.name} ---\n${d.extracted_text ?? ""}`)
        .join("\n\n")
        .slice(0, 80000);
      contextBlock = `Here are the patient's medical documents:\n<documents>\n${combined}\n</documents>`;
    }
  } else if (documentText) {
    contextBlock = `Here is the patient's medical document:\n<document>\n${(documentText as string).slice(0, 80000)}\n</document>`;
  } else if (Array.isArray(conditions) && conditions.length > 0) {
    contextBlock = `The patient has the following condition(s): ${(conditions as string[]).join(", ")}.`;
  }

  if (!contextBlock) {
    return NextResponse.json(
      { error: "Missing context (document or conditions)." },
      { status: 400 }
    );
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a compassionate medical guide helping a patient understand their health.
Explain things in plain, clear, empathetic language — as if you're a trusted friend who happens to know medicine well.
Avoid jargon. If you use a medical term, briefly explain it. Be warm and reassuring, but always accurate.

${contextBlock}

The patient's question is:
${question}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ answer: text });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error("Claude API error:", error.status, error.message);
    return NextResponse.json(
      { error: error.message ?? "Claude API error" },
      { status: error.status ?? 500 }
    );
  }
}
