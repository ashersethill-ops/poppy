import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.name.endsWith(".txt")) {
    return NextResponse.json({ text: buffer.toString("utf-8") });
  }

  if (file.name.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    return NextResponse.json({ text: data.text });
  }

  return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
}
