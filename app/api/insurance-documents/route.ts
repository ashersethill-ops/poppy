import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("documents")
    .select("id, name, size_bytes, uploaded_at")
    .eq("user_id", user.id)
    .eq("document_type", "insurance")
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const nameLower = file.name.toLowerCase();
  const isPDF = nameLower.endsWith(".pdf");
  const isTXT = nameLower.endsWith(".txt");

  if (!isPDF && !isTXT) {
    return NextResponse.json({ error: "Only PDF and TXT files are supported" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 10 MB" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let extractedText = "";
  try {
    extractedText = isTXT
      ? buffer.toString("utf-8")
      : (await pdfParse(buffer)).text;
  } catch {
    return NextResponse.json({ error: "Could not read file content" }, { status: 422 });
  }

  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      name: file.name,
      extracted_text: extractedText,
      size_bytes: file.size,
      document_type: "insurance",
    })
    .select("id, name, size_bytes, uploaded_at")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ document: doc });
}
