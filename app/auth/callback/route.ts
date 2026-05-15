import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // ── Allowlist check ────────────────────────────────────────────────
        const { count } = await supabase
          .from("allowed_users")
          .select("email", { count: "exact", head: true })
          .eq("email", user.email);

        if ((count ?? 0) === 0) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=not_allowed`);
        }

        // ── Onboarding check ───────────────────────────────────────────────
        if (next === "/dashboard") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .single();

          if (!profile?.onboarding_completed) {
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
