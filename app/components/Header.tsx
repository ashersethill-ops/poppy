"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PoppyIcon from "./PoppyIcon";
import { signOut } from "@/app/actions";
import { usePoppyContext } from "./PoppyProvider";

type Role = "patient" | "doctor" | "custodian";

const ROLE_NAV: Record<Role, { href: string; label: string }[]> = {
  patient: [
    { href: "/dashboard",  label: "Home" },
    { href: "/overview",   label: "Story" },
    { href: "/documents",  label: "Documents" },
    { href: "/specialist", label: "Specialists" },
    { href: "/learn",      label: "Learn" },
    { href: "/trials",     label: "Trials" },
    { href: "/community",  label: "Community" },
    { href: "/my-doctors", label: "My Doctors" },
  ],
  doctor: [
    { href: "/doctor",      label: "Home" },
    { href: "/my-patients", label: "My Patients" },
    { href: "/doctor/todo", label: "To-Do" },
  ],
  custodian: [
    { href: "/dashboard",  label: "Home" },
    { href: "/overview",   label: "Story" },
    { href: "/documents",  label: "Documents" },
    { href: "/specialist", label: "Specialists" },
    { href: "/learn",      label: "Learn" },
    { href: "/trials",     label: "Trials" },
    { href: "/community",  label: "Community" },
    { href: "/my-doctors", label: "My Doctors" },
  ],
};

const ROLE_BADGES: Record<Role, { label: string; bg: string; text: string }> = {
  patient:   { label: "Patient", bg: "#dcfce7", text: "#15803d" },
  doctor:    { label: "Doctor",  bg: "#dbeafe", text: "#1d4ed8" },
  custodian: { label: "Carer",   bg: "#f3e8ff", text: "#7e22ce" },
};

const ROLE_HOME: Record<Role, string> = {
  patient:   "/dashboard",
  doctor:    "/doctor",
  custodian: "/dashboard",
};

type Props = {
  displayName: string | null;
  loggedIn: boolean;
  isDoctor?: boolean;
  isCustodian?: boolean;
  isPatient?: boolean;
};

export default function Header({
  displayName,
  loggedIn,
  isDoctor = false,
  isCustodian = false,
  isPatient = false,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { conditions, setForceOnboarding, isCustodian: ctxIsCustodian } = usePoppyContext();

  // These pages have their own full-screen layouts — no top header needed
  if (["/dashboard", "/about", "/", "/signup", "/login"].includes(pathname)) return null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use context value (client-side, fresh from /api/profile) when available,
  // falling back to SSR prop. This ensures the role badge is correct even when
  // the SSR prop is stale (e.g. is_custodian not returned by layout.tsx).
  const effectiveIsCustodian = ctxIsCustodian || isCustodian;

  // Build list of roles this user has
  const availableRoles: Role[] = [];
  if (isPatient || (!isDoctor && !effectiveIsCustodian)) availableRoles.push("patient");
  if (isDoctor) availableRoles.push("doctor");
  if (effectiveIsCustodian) availableRoles.push("custodian");

  const defaultRole = availableRoles[0] ?? "patient";
  const [activeRole, setActiveRole] = useState<Role>(defaultRole);

  // Restore last role from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("poppy_active_role") as Role | null;
    if (saved && availableRoles.includes(saved)) {
      setActiveRole(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When context loads with isCustodian=true (overriding stale SSR prop),
  // update activeRole to custodian unless the user manually picked a different role.
  useEffect(() => {
    if (ctxIsCustodian) {
      const saved = localStorage.getItem("poppy_active_role") as Role | null;
      if (!saved || saved === "patient") {
        setActiveRole("custodian");
        localStorage.setItem("poppy_active_role", "custodian");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxIsCustodian]);

  function switchRole(role: Role) {
    setActiveRole(role);
    localStorage.setItem("poppy_active_role", role);
    setDropdownOpen(false);
    setMobileOpen(false);
    // Prompt a doctor switching to patient view to set up their conditions
    if (role === "patient" && conditions.length === 0) {
      setForceOnboarding(true);
    }
    router.push(ROLE_HOME[role]);
  }

  const navLinks = ROLE_NAV[activeRole];
  const badge = ROLE_BADGES[activeRole];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="border-b border-stone-200" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center gap-3">
        <PoppyIcon size={36} />
        <Link
          href={loggedIn ? ROLE_HOME[activeRole] : "/"}
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--primary)" }}
        >
          Poppy
        </Link>

        {/* Desktop nav */}
        {loggedIn && (
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: active ? "var(--soft)" : "transparent",
                    color: active ? "var(--accent)" : "var(--primary)",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {loggedIn ? (
            <>
              {/* Desktop user dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--primary)" }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                    style={{ background: "var(--accent)" }}
                  >
                    {displayName ? displayName[0].toUpperCase() : "?"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {displayName}
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-2xl shadow-lg border border-stone-100 py-1.5 z-50"
                    style={{ background: "var(--background)" }}
                  >
                    {/* Role switcher — only shown when user has multiple roles */}
                    {availableRoles.length > 1 && (
                      <>
                        <p className="px-4 pt-1.5 pb-1 text-xs font-medium text-stone-400 uppercase tracking-wide">
                          Switch view
                        </p>
                        {availableRoles.map((role) => {
                          const rb = ROLE_BADGES[role];
                          const isActive = role === activeRole;
                          return (
                            <button
                              key={role}
                              onClick={() => switchRole(role)}
                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:opacity-70 transition-opacity"
                              style={{ color: "var(--primary)" }}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: isActive ? rb.text : "#d1d5db" }}
                              />
                              <span>{rb.label} view</span>
                              {isActive && (
                                <span className="ml-auto text-xs font-medium" style={{ color: rb.text }}>
                                  Active
                                </span>
                              )}
                            </button>
                          );
                        })}
                        <div className="my-1.5 border-t border-stone-100" />
                      </>
                    )}

                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-sm hover:opacity-70 transition-opacity"
                      style={{ color: "var(--primary)" }}
                    >
                      My Profile
                    </Link>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="w-full text-left px-4 py-2.5 text-sm hover:opacity-70 transition-opacity border-t border-stone-100"
                        style={{ color: "var(--primary)" }}
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Mobile avatar + hamburger */}
              <span
                className="md:hidden w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                {displayName ? displayName[0].toUpperCase() : "?"}
              </span>
              <button
                className="md:hidden p-2 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--primary)" }}
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: "var(--primary)" }}
              >
                Sign in
              </a>
              <a
                href="/signup"
                className="px-4 py-2 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                Create account
              </a>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {loggedIn && mobileOpen && (
        <nav
          className="md:hidden border-t border-stone-100 px-4 py-3 flex flex-col gap-1"
          style={{ background: "var(--background)" }}
        >
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--soft)" : "transparent",
                  color: active ? "var(--accent)" : "var(--primary)",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* Mobile role switcher */}
          {availableRoles.length > 1 && (
            <div className="mt-2 pt-2 border-t border-stone-100">
              <p className="px-3 pb-1 text-xs font-medium text-stone-400 uppercase tracking-wide">
                Switch view
              </p>
              {availableRoles.map((role) => {
                const rb = ROLE_BADGES[role];
                const isActive = role === activeRole;
                return (
                  <button
                    key={role}
                    onClick={() => switchRole(role)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 hover:opacity-70 transition-opacity"
                    style={{ color: "var(--primary)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: isActive ? rb.text : "#d1d5db" }}
                    />
                    <span>{rb.label} view</span>
                    {isActive && (
                      <span className="ml-auto text-xs font-medium" style={{ color: rb.text }}>
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-stone-100">
            <div className="px-3 pb-1.5 flex items-center gap-1.5 flex-wrap">
              <p className="text-xs text-stone-400">{displayName}</p>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: badge.bg, color: badge.text }}
              >
                {badge.label}
              </span>
            </div>
            <Link
              href="/profile"
              className="block px-3 py-2.5 rounded-xl text-sm hover:opacity-70 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              My Profile
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm hover:opacity-70 transition-opacity"
                style={{ color: "var(--primary)" }}
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
