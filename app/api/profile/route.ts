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
  // Strategy: try UPDATE first (surgical — only touches columns in `updates`).
  // If no row exists yet (PGRST116, new user before signup trigger fires),
  // fall back to INSERT so the profile is created rather than silently dropped.
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (!error) {
    return NextResponse.json({ profile: data });
  }

  // PGRST116 = "The result contains 0 rows" — profile row doesn't exist yet.
  // Use the admin client (service role) so RLS doesn't block the INSERT for new users.
  if (error.code === "PGRST116") {
    const adminClient = createAdminClient();
    const { data: inserted, error: insertError } = await adminClient
      .from("profiles")
      .insert({ id: user.id, ...updates })
      .select()
      .single();

    if (insertError) {
      console.error("[api/profile] insert fallback failed:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    console.log("[api/profile] Created new profile row for user:", user.id);
    return NextResponse.json({ profile: inserted });
  }

  console.error("[api/profile] update failed:", error.message);
  return NextResponse.json({ error: error.message }, { status: 500 });
}
