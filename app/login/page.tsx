"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PoppyIcon from "../components/PoppyIcon";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  // Only show the private-beta notice when the callback explicitly set this param.
  const accessDenied = searchParams.get("error") === "access_denied";
  const authFailed   = searchParams.get("error") === "auth_failed";

  async function handleGoogleSignIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-6 py-16">
      <div
        className="w-full max-w-sm rounded-3xl px-8 py-10 flex flex-col items-center text-center"
        style={{ background: "var(--soft)" }}
      >
        <div className="mb-6">
          <PoppyIcon size={64} />
        </div>

        <h1
          className="text-2xl font-semibold tracking-tight mb-2"
          style={{ color: "var(--primary)" }}
        >
          Welcome back
        </h1>

        <p className="text-stone-500 text-sm leading-relaxed mb-8">
          Good to see you again. Sign in to pick up right where you left off.
        </p>

        {accessDenied && (
          <div className="w-full mb-5 px-4 py-3 rounded-2xl bg-amber-50 text-amber-800 text-sm text-left">
            This is a private beta — please contact us for access.
          </div>
        )}

        {authFailed && (
          <div className="w-full mb-5 px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-sm text-left">
            Something went wrong signing you in. Please try again.
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 rounded-full px-6 py-3.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <GoogleLogo />
          )}
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="mt-6 flex items-start gap-2 text-left">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--accent)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <p className="text-xs text-stone-400 leading-relaxed">
            Your data is always encrypted and private. We never share your
            personal or medical information.
          </p>
        </div>

        <p className="mt-6 text-sm text-stone-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="underline underline-offset-2 hover:opacity-70 transition-opacity"
            style={{ color: "var(--primary)" }}
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
