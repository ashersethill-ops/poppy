import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — list all doctors the patient has added
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("patient_doctor_consents")
    .select("id, doctor_email, status, granted_at, revoked_at")
    .eq("patient_id", user.id)
    .order("granted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ doctors: data ?? [] });
}

// POST — add a doctor by email (grants consent)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { doctor_email } = await req.json();
  const email = (doctor_email ?? "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid doctor email required" }, { status: 400 });
  }

  // Resolve the patient's display name — try profile first, fall back to auth metadata / email
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, patient_name, is_custodian")
    .eq("id", user.id)
    .maybeSingle();

  const patientName: string =
    (profile?.is_custodian ? profile?.patient_name : null) ??
    profile?.name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    "Unknown";

  const { data, error } = await supabase
    .from("patient_doctor_consents")
    .upsert(
      {
        patient_id: user.id,
        doctor_email: email,
        status: "active",
        granted_at: new Date().toISOString(),
        revoked_at: null,
        patient_name: patientName,
      },
      { onConflict: "patient_id,doctor_email" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ consent: data });
}

// DELETE — revoke a single doctor (body: { id }) or remove all (no body)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let id: string | undefined;
  try { id = (await req.json())?.id; } catch { /* no body = delete all */ }

  if (id) {
    const { error } = await supabase
      .from("patient_doctor_consents")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("patient_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("patient_doctor_consents")
      .delete()
      .eq("patient_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
