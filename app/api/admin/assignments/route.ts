import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireMasterAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", supabase, user: null };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "master_admin") return { error: "Forbidden", supabase, user: null };

  return { error: null, supabase, user };
}

// GET — all condition assignments
export async function GET() {
  const { error, supabase } = await requireMasterAdmin();
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { data, error: dbError } = await supabase
    .from("condition_assignments")
    .select("*")
    .order("condition_name");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ assignments: data ?? [] });
}

// POST — assign or reassign an advisor to a condition
export async function POST(req: NextRequest) {
  const { error, supabase, user } = await requireMasterAdmin();
  if (error || !user) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { condition_name, advisor_id, advisor_name, advisor_email } = await req.json();
  if (!condition_name || !advisor_id) {
    return NextResponse.json({ error: "condition_name and advisor_id required" }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from("condition_assignments")
    .upsert({
      condition_name,
      advisor_id,
      advisor_name: advisor_name ?? null,
      advisor_email: advisor_email ?? null,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
    }, { onConflict: "condition_name" });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove an assignment
export async function DELETE(req: NextRequest) {
  const { error, supabase } = await requireMasterAdmin();
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { condition_name } = await req.json();
  if (!condition_name) return NextResponse.json({ error: "condition_name required" }, { status: 400 });

  const { error: dbError } = await supabase
    .from("condition_assignments")
    .delete()
    .eq("condition_name", condition_name);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
