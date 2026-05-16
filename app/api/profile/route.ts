import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const {
    conditions, date_of_birth, phone, onboarding_completed,
    name, is_doctor, is_custodian, location, patient_name,
    location_lat, location_lng,
  } = body;

  // Build a PATCH object containing ONLY the fields explicitly sent in the
  // request body. Fields absent from the body are NOT included, so this call
  // can never silently zero-out a field the caller didn't mention.
  const updates: Record<string, unknown> = {};
  if (conditions     !== undefined) updates.conditions     = conditions;
  if (date_of_birth  !== undefined) updates.date_of_birth  = date_of_birth;
  if (phone          !== undefined) updates.phone          = phone;
  if (onboarding_completed !== undefined) updates.onboarding_completed = onboarding_completed;
  if (name           !== undefined) updates.name           = name;
  if (is_doctor      !== undefined) updates.is_doctor      = is_doctor;
  if (is_custodian   !== undefined) updates.is_custodian   = is_custodian;
  if (location       !== undefined) updates.location       = location;
  if (patient_name   !== undefined) updates.patient_name   = patient_name;
  if (location_lat   !== undefined) updates.location_lat   = location_lat;
  if (location_lng   !== undefined) updates.location_lng   = location_lng;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // PROFILE WRITE — triggered by: explicit client PATCH /api/profile call.
  // Use admin client + upsert so this works for both new users (no row yet) and
  // existing users, without hitting RLS restrictions on INSERT.
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .upsert({ id: user.id, ...updates }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[api/profile] upsert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
