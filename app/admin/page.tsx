"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CONDITIONS, CONDITION_GROUPS, CONDITION_TO_GROUP } from "../components/conditions";

// ── Types ─────────────────────────────────────────────────────────────────────

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "health_advisor" | "master_admin";
  conditions: string[] | null;
  created_at: string;
};

type Assignment = {
  condition_name: string;
  advisor_id: string;
  advisor_name: string | null;
  advisor_email: string | null;
  assigned_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const roleMeta = {
  master_admin:  { label: "Master Admin",   bg: "#fef3c7", text: "#d97706" },
  health_advisor:{ label: "Health Advisor", bg: "#dbeafe", text: "#1d4ed8" },
  user:          { label: "User",           bg: "var(--soft)", text: "#9ca3af" },
};

function RoleBadge({ role }: { role: string }) {
  const m = roleMeta[role as keyof typeof roleMeta] ?? roleMeta.user;
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: m.bg, color: m.text }}>
      {m.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1" style={{ background: "var(--background)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <p className="text-2xl font-semibold" style={{ color: "var(--primary)" }}>{value}</p>
      <p className="text-xs text-stone-400">{label}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "conditions">("users");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [conditionSearch, setConditionSearch] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(CONDITION_GROUPS.map((g) => g.label))
  );

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }

  function toggleAllGroups(open: boolean) {
    setOpenGroups(open ? new Set(CONDITION_GROUPS.map((g) => g.label)) : new Set());
  }

  // Check access + load data
  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => {
        if (r.status === 401) { router.replace("/dashboard"); return null; }
        if (r.status === 403) { router.replace("/dashboard"); return null; }
        return r.json();
      })
      .then((d) => { if (d?.users) setUsers(d.users); })
      .finally(() => setUsersLoading(false));

    fetch("/api/admin/assignments")
      .then((r) => r.json())
      .then((d) => { if (d?.assignments) setAssignments(d.assignments); })
      .finally(() => setAssignmentsLoading(false));
  }, [router]);

  async function updateRole(userId: string, role: string) {
    setRoleUpdating(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: role as User["role"] } : u));
    setRoleUpdating(null);
  }

  async function assignAdvisor(condition_name: string, advisor: User) {
    setAssigning(condition_name);
    await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        condition_name,
        advisor_id: advisor.id,
        advisor_name: advisor.name ?? advisor.email,
        advisor_email: advisor.email,
      }),
    });
    setAssignments((prev) => {
      const filtered = prev.filter((a) => a.condition_name !== condition_name);
      return [...filtered, {
        condition_name,
        advisor_id: advisor.id,
        advisor_name: advisor.name ?? advisor.email,
        advisor_email: advisor.email,
        assigned_at: new Date().toISOString(),
      }];
    });
    setAssigning(null);
  }

  async function removeAssignment(condition_name: string) {
    setAssigning(condition_name);
    await fetch("/api/admin/assignments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition_name }),
    });
    setAssignments((prev) => prev.filter((a) => a.condition_name !== condition_name));
    setAssigning(null);
  }

  const advisors = users.filter((u) => ["health_advisor", "master_admin"].includes(u.role));
  const filteredUsers = users.filter((u) =>
    !userSearch || [u.name, u.email].some((s) => s?.toLowerCase().includes(userSearch.toLowerCase()))
  );
  const filteredConditions = CONDITIONS.filter((c) =>
    !conditionSearch || c.toLowerCase().includes(conditionSearch.toLowerCase())
  );

  const assignmentMap = Object.fromEntries(assignments.map((a) => [a.condition_name, a]));
  const assignedCount = assignments.length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#d97706" }}>
              Master Admin
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--primary)" }}>Admin Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">Manage users, roles, and condition advisor assignments.</p>
        </div>
        <a href="/advisor" className="text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-70" style={{ background: "var(--soft)", color: "var(--primary)" }}>
          → Advisor view
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Total users" value={usersLoading ? "—" : users.length} />
        <Stat label="Health advisors" value={usersLoading ? "—" : advisors.length} />
        <Stat label="Conditions covered" value={assignmentsLoading ? "—" : assignedCount} />
        <Stat label="Conditions total" value={CONDITIONS.length} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl w-fit" style={{ background: "var(--soft)" }}>
        {(["users", "conditions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === t
              ? { background: "var(--background)", color: "var(--accent)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
              : { color: "var(--primary)" }
            }
          >
            {t === "users" ? "Users" : "Condition Advisors"}
          </button>
        ))}
      </div>

      {/* ── Users tab ── */}
      {tab === "users" && (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          {/* Search */}
          <div className="px-6 py-4 border-b" style={{ borderColor: "var(--soft)" }}>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full max-w-sm px-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: "var(--soft)", color: "var(--foreground)" }}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--soft)" }}>
                  {["User", "Role", "Conditions", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--soft)" }}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-3 rounded-full animate-pulse" style={{ background: "var(--soft)", width: j === 0 ? "140px" : "60px" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: "1px solid var(--soft)" }}
                        className="transition-colors hover:bg-stone-50">
                        <td className="px-6 py-4">
                          <p className="font-medium" style={{ color: "var(--primary)" }}>{user.name ?? "—"}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 text-stone-500">
                          {user.conditions?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {user.conditions.slice(0, 2).map((c) => (
                                <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--soft)", color: "var(--accent)" }}>{c}</span>
                              ))}
                              {user.conditions.length > 2 && (
                                <span className="text-xs text-stone-400">+{user.conditions.length - 2}</span>
                              )}
                            </div>
                          ) : <span className="text-xs text-stone-300">None</span>}
                        </td>
                        <td className="px-6 py-4 text-stone-400 text-xs">
                          {new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {user.role === "user" && (
                              <button
                                onClick={() => updateRole(user.id, "health_advisor")}
                                disabled={roleUpdating === user.id}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                                style={{ background: "#dbeafe", color: "#1d4ed8" }}
                              >
                                Make Advisor
                              </button>
                            )}
                            {user.role === "health_advisor" && (
                              <button
                                onClick={() => updateRole(user.id, "user")}
                                disabled={roleUpdating === user.id}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                                style={{ background: "var(--soft)", color: "#9ca3af" }}
                              >
                                Revoke Advisor
                              </button>
                            )}
                            {user.role === "master_admin" && (
                              <span className="text-xs text-stone-300">Master Admin</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {!usersLoading && filteredUsers.length === 0 && (
            <p className="text-center text-stone-400 text-sm py-10">No users match your search.</p>
          )}
        </div>
      )}

      {/* ── Conditions tab ── */}
      {tab === "conditions" && (
        <div className="flex flex-col gap-4">

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search conditions…"
                value={conditionSearch}
                onChange={(e) => setConditionSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                style={{ background: "var(--background)", color: "var(--foreground)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minWidth: "240px" }}
              />
              {conditionSearch && (
                <button
                  onClick={() => setConditionSearch("")}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Expand / Collapse all — only shown when not searching */}
            {!conditionSearch && (
              <div className="flex gap-1">
                <button
                  onClick={() => toggleAllGroups(true)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ background: "var(--soft)", color: "var(--primary)" }}
                >
                  Expand all
                </button>
                <button
                  onClick={() => toggleAllGroups(false)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ background: "var(--soft)", color: "var(--primary)" }}
                >
                  Collapse all
                </button>
              </div>
            )}

            {advisors.length === 0 && (
              <p className="text-xs text-stone-400">No health advisors yet — promote a user on the Users tab first.</p>
            )}
          </div>

          {/* ── Search results: flat table ── */}
          {conditionSearch && (
            <div className="rounded-3xl overflow-hidden" style={{ background: "var(--background)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--soft)" }}>
                      {["Condition", "Assigned Advisor", "Since", "Action"].map((h) => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConditions.map((condition) => {
                      const assignment = assignmentMap[condition];
                      const busy = assigning === condition;
                      const group = CONDITION_TO_GROUP[condition];
                      return (
                        <tr key={condition} style={{ borderBottom: "1px solid var(--soft)" }} className="transition-colors hover:bg-stone-50">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium" style={{ color: "var(--primary)" }}>{condition}</span>
                              {group && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: group.bg, color: group.text }}>
                                  {group.label}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            {assignment ? (
                              <div>
                                <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{assignment.advisor_name ?? "—"}</p>
                                <p className="text-xs text-stone-400">{assignment.advisor_email}</p>
                              </div>
                            ) : <span className="text-xs text-stone-300">Unassigned</span>}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-stone-400">
                            {assignment ? new Date(assignment.assigned_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              {advisors.length > 0 && (
                                <select
                                  disabled={busy}
                                  defaultValue=""
                                  onChange={(e) => {
                                    const advisor = advisors.find((a) => a.id === e.target.value);
                                    if (advisor) assignAdvisor(condition, advisor);
                                    e.target.value = "";
                                  }}
                                  className="text-xs px-3 py-1.5 rounded-lg outline-none cursor-pointer disabled:opacity-40"
                                  style={{ background: "#dbeafe", color: "#1d4ed8", border: "none" }}
                                >
                                  <option value="" disabled>{assignment ? "Reassign…" : "Assign advisor…"}</option>
                                  {advisors.map((a) => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
                                </select>
                              )}
                              {assignment && (
                                <button onClick={() => removeAssignment(condition)} disabled={busy}
                                  className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
                                  style={{ background: "#fee2e2", color: "#dc2626" }}>
                                  Remove
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredConditions.length === 0 && (
                <p className="text-center text-stone-400 text-sm py-10">No conditions match &ldquo;{conditionSearch}&rdquo;.</p>
              )}
            </div>
          )}

          {/* ── Grouped sections ── */}
          {!conditionSearch && CONDITION_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.label);
            const assignedInGroup = group.conditions.filter((c) => assignmentMap[c]).length;

            return (
              <div key={group.label} className="rounded-3xl overflow-hidden" style={{ background: "var(--background)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80"
                  style={{ borderBottom: isOpen ? "1px solid var(--soft)" : "none" }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: group.bg, color: group.text }}>
                      {group.label}
                    </span>
                    <span className="text-xs text-stone-400">{group.conditions.length} conditions</span>
                    {assignedInGroup > 0 && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#15803d" }}>
                        {assignedInGroup}/{group.conditions.length} assigned
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Group rows */}
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--soft)" }}>
                          {["Condition", "Assigned Advisor", "Since", "Action"].map((h) => (
                            <th key={h} className="text-left px-6 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.conditions.map((condition) => {
                          const assignment = assignmentMap[condition];
                          const busy = assigning === condition;
                          return (
                            <tr key={condition} style={{ borderBottom: "1px solid var(--soft)" }} className="transition-colors hover:bg-stone-50">
                              <td className="px-6 py-3.5 font-medium" style={{ color: "var(--primary)" }}>{condition}</td>
                              <td className="px-6 py-3.5">
                                {assignment ? (
                                  <div>
                                    <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{assignment.advisor_name ?? "—"}</p>
                                    <p className="text-xs text-stone-400">{assignment.advisor_email}</p>
                                  </div>
                                ) : <span className="text-xs text-stone-300">Unassigned</span>}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-stone-400">
                                {assignment ? new Date(assignment.assigned_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2">
                                  {advisors.length > 0 && (
                                    <select
                                      disabled={busy}
                                      defaultValue=""
                                      onChange={(e) => {
                                        const advisor = advisors.find((a) => a.id === e.target.value);
                                        if (advisor) assignAdvisor(condition, advisor);
                                        e.target.value = "";
                                      }}
                                      className="text-xs px-3 py-1.5 rounded-lg outline-none cursor-pointer disabled:opacity-40"
                                      style={{ background: "#dbeafe", color: "#1d4ed8", border: "none" }}
                                    >
                                      <option value="" disabled>{assignment ? "Reassign…" : "Assign advisor…"}</option>
                                      {advisors.map((a) => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
                                    </select>
                                  )}
                                  {assignment && (
                                    <button onClick={() => removeAssignment(condition)} disabled={busy}
                                      className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
                                      style={{ background: "#fee2e2", color: "#dc2626" }}>
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
