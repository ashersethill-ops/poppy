import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

// GET — notes for my assigned conditions (or all conditions for master_admin)
export async function GET() {
  const { error, supabase, user } = await requireAdvisor();
  if (error || !user) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  // Get assigned conditions
  const { data: assignments } = await supabase
    .from("condition_assignments")
    .select("condition_name")
    .eq("advisor_id", user.id);

  const conditions = (assignments ?? []).map((a) => a.condition_name);

  let query = supabase
    .from("advisor_notes")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Advisors only see their own conditions; master_admin sees all
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "master_admin") {
    if (conditions.length === 0) return NextResponse.json({ notes: [], conditions: [] });
    query = query.in("condition_name", conditions);
  }

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ notes: data ?? [], conditions });
}

// POST — create a new note
export async function POST(req: NextRequest) {
  const { error, supabase, user } = await requireAdvisor();
  if (error || !user) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { condition_name, note_type, title, description, url } = await req.json();
  if (!condition_name || !note_type || !title) {
    return NextResponse.json({ error: "condition_name, note_type, title required" }, { status: 400 });
  }

  const { data, error: dbError } = await supabase
    .from("advisor_notes")
    .insert({ condition_name, advisor_id: user.id, note_type, title, description, url })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

// DELETE — archive a note
export async function DELETE(req: NextRequest) {
  const { error, supabase, user } = await requireAdvisor();
  if (error || !user) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error: dbError } = await supabase
    .from("advisor_notes")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("advisor_id", user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
