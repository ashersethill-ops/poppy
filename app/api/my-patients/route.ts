import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — list all patients who have consented to the current doctor
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("get_my_patients");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ patients: data ?? [] });
}
