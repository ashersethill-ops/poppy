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

// GET — list all users via security-definer RPC
export async function GET() {
  const { error, supabase } = await requireMasterAdmin();
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { data, error: rpcError } = await supabase.rpc("admin_get_all_users");
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  return NextResponse.json({ users: data ?? [] });
}

// PATCH — update a user's role
export async function PATCH(req: NextRequest) {
  const { error, supabase } = await requireMasterAdmin();
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });

  const { userId, role } = await req.json();
  if (!userId || !["user", "health_advisor", "master_admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: userId, role })
    .eq("id", userId);

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
