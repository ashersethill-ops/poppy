import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ?? null });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { conditions, date_of_birth, phone, onboarding_completed, name, is_doctor, is_custodian, location, patient_name } = body;

  const updates: Record<string, unknown> = { id: user.id };
  if (conditions !== undefined) updates.conditions = conditions;
  if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
  if (phone !== undefined) updates.phone = phone;
  if (onboarding_completed !== undefined) updates.onboarding_completed = onboarding_completed;
  if (name !== undefined) updates.name = name;
  if (is_doctor !== undefined) updates.is_doctor = is_doctor;
  if (is_custodian !== undefined) updates.is_custodian = is_custodian;
  if (location !== undefined) updates.location = location;
  if (patient_name !== undefined) updates.patient_name = patient_name;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(updates)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
