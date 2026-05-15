import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import PoppyProvider from "./components/PoppyProvider";
import { createClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/profile-names";

export const metadata: Metadata = {
  title: "Poppy",
  description: "Understand your medical documents in plain language.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch role flags and name fields from profile
  const { data: profile } = user
    ? await supabase.from("profiles").select("is_doctor, is_custodian, conditions, name, patient_name").eq("id", user.id).maybeSingle()
    : { data: null };

  // Header always shows the patient name — same rule as the rest of the app
  const displayName = getDisplayName(profile) ?? (
    user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email
    ?? null
  );

  // Auto-detect doctor: check if this user's email has any active patient consents
  const { count: consentCount } = user?.email
    ? await supabase
        .from("patient_doctor_consents")
        .select("id", { count: "exact", head: true })
        .eq("doctor_email", user.email)
        .eq("status", "active")
    : { count: 0 };

  const isDoctor    = (profile?.is_doctor ?? false) || (consentCount ?? 0) > 0;
  const isCustodian = profile?.is_custodian ?? false;
  const isPatient   = Array.isArray(profile?.conditions) && profile.conditions.length > 0;

  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: "var(--background)" }}>
        <PoppyProvider>
          <Header
            loggedIn={!!user}
            displayName={displayName}
            isDoctor={isDoctor}
            isCustodian={isCustodian}
            isPatient={isPatient}
          />
          <main>{children}</main>
        </PoppyProvider>
      </body>
    </html>
  );
}
