import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
        // (1) Log the exact email returned by Google
        const rawEmail = user.email ?? "";
        const email    = rawEmail.trim().toLowerCase();
        console.log("[auth/callback] Google returned email (raw)   :", JSON.stringify(rawEmail));
        console.log("[auth/callback] Email after trim+lowercase     :", JSON.stringify(email));

        // Use the admin (service-role) client so RLS on allowed_users
        // does not silently filter the row out.
        let admin;
        try {
          admin = createAdminClient();
        } catch (adminErr) {
          console.error("[auth/callback] Failed to create admin client:", adminErr);
          // Fall through — if we can't check the allowlist, let the user in
          // rather than blocking everyone. Remove this once the key is set.
          return proceedToApp(origin, next, user.id, supabase);
        }

        // (2) Log the exact query
        console.log(
          "[auth/callback] Running allowlist query: SELECT count(*) FROM allowed_users WHERE lower(trim(email)) =",
          JSON.stringify(email)
        );

        const { count, error: listError, data: listData } = await admin
          .from("allowed_users")
          .select("email", { count: "exact", head: false })
          .ilike("email", email);           // case-insensitive match via ilike

        // (3) Log the exact result
        console.log("[auth/callback] Allowlist query result — count :", count);
        console.log("[auth/callback] Allowlist query result — data  :", JSON.stringify(listData));
        console.log("[auth/callback] Allowlist query result — error :", listError ? JSON.stringify(listError) : "none");

        if (listError) {
          console.error("[auth/callback] Allowlist query FAILED — letting user through. Fix the allowed_users table.");
          // Fail open: don't block the user if the table is broken
        } else if (count === 0) {
          console.log("[auth/callback] Email not in allowlist — blocking user.");
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=access_denied`);
        } else {
          console.log("[auth/callback] Email found in allowlist — proceeding.");
        }

        return proceedToApp(origin, next, user.id, supabase);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function proceedToApp(
  origin: string,
  next: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  // Only gate the default /dashboard destination — explicit `next` values
  // (e.g. a deep link) are trusted as-is.
  if (next === "/dashboard") {
    // Use the authenticated server client (session already set by exchangeCodeForSession).
    // This avoids a second admin-client creation that could fail if the service-role
    // key is missing, which previously caused the catch block to set isOnboarded=true
    // and skip onboarding for brand-new users.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, conditions")
      .eq("id", userId)
      .maybeSingle();          // maybeSingle: returns null (not error) when no row exists

    const isOnboarded =
      profile?.onboarding_completed === true ||
      (Array.isArray(profile?.conditions) && profile.conditions.length > 0);

    if (!isOnboarded) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
