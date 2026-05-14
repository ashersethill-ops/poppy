import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchDocumentContext } from "@/lib/fetchDocumentContext";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, conditions, pageContext, documentIds, patientId, isDoctor } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch document text server-side — raw content never leaves the server
  let documentContext = "";
  if (Array.isArray(documentIds) && documentIds.length > 0 && user) {
    if (patientId && isDoctor) {
      // Doctor reviewing a patient — verify consent before fetching patient's docs
      const { data: hasConsent } = await supabase.rpc("has_patient_consent", { p_patient_id: patientId });
      if (hasConsent) {
        documentContext = await fetchDocumentContext(supabase, patientId, documentIds, 60000);
      }
    } else {
      // Regular patient chat — use the logged-in user's own documents
      documentContext = await fetchDocumentContext(supabase, user.id, documentIds, 60000);
    }
  }

  const conditionLine = Array.isArray(conditions) && conditions.length > 0
    ? `The patient has these conditions: ${conditions.join(", ")}.`
    : "The patient has not yet added any conditions to their profile.";

  const documentSection = documentContext
    ? `\n\nThe patient has uploaded medical documents. Use these to give highly specific, personalised answers:\n\n${documentContext}`
    : "";

  const pageContextLine = pageContext ? `\nCurrent page: ${pageContext}` : "";

  const systemPrompt = isDoctor
    ? `You are Poppy, a clinical AI assistant helping a doctor review a patient's medical record.

Your role:
- Provide clear, accurate clinical summaries and insights based on the patient's conditions and documents
- Help the doctor understand findings, identify patterns, and prepare questions for the patient
- Highlight anything clinically significant from the uploaded documents
- Use appropriate clinical language — this is a professional medical context
- Do not diagnose or prescribe, but you can discuss findings and relevant clinical considerations

${conditionLine}${documentSection}${pageContextLine}

Keep responses clear and structured. Use bullet points and headers where helpful.`
    : `You are Poppy, a compassionate and knowledgeable medical guide built into a patient health app.

Your role:
- Help patients understand their health conditions in plain, clear, empathetic language
- Be like a trusted friend who happens to know medicine well
- When medical documents are available, reference them directly and specifically in your answers
- Avoid jargon; when you must use medical terms, briefly explain them
- Be warm, reassuring, and supportive — but always accurate
- Never diagnose or prescribe — always encourage consulting their healthcare team

${conditionLine}${documentSection}${pageContextLine}

Keep responses concise and friendly. Use short paragraphs. Use bullet points when listing items.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: isDoctor ? 2048 : 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ message: text });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message ?? "API error" }, { status: error.status ?? 500 });
  }
}
