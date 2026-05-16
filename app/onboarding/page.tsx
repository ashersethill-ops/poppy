"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ConditionSelector from "../components/ConditionSelector";
import { usePoppyContext } from "../components/PoppyProvider";

type Screen = 1 | 2 | 3 | 4 | "analyzing" | "confirm" | "conditions" | "role" | 5;

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(lines: string[], speed = 35, pause = 550) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const key = lines.join("\x00");

  useEffect(() => {
    setDisplayed([]);
    setDone(false);
    if (lines.length === 0) return;

    let cancelled = false;
    let li = 0;
    let ci = 0;

    function tick() {
      if (cancelled) return;
      if (li >= lines.length) { setDone(true); return; }
      const line = lines[li];
      if (ci === 0) setDisplayed((p) => [...p, ""]);
      if (ci < line.length) {
        const ch = line[ci];
        setDisplayed((p) => { const n = [...p]; n[li] = n[li] + ch; return n; });
        ci++;
        setTimeout(tick, speed);
      } else {
        li++; ci = 0;
        setTimeout(tick, pause);
      }
    }

    const t = setTimeout(tick, 120);
    return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { displayed, done };
}

// ─── Cursor ───────────────────────────────────────────────────────────────────
function Cursor() {
  return (
    <span
      className="inline-block align-middle ml-0.5 animate-pulse"
      style={{ width: 2, height: "0.85em", background: "var(--accent)", borderRadius: 1 }}
    />
  );
}

// ─── TypedText ────────────────────────────────────────────────────────────────
function TypedText({ displayed, done }: { displayed: string[]; done: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      {displayed.map((line, i) => (
        <p
          key={i}
          className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight leading-tight"
          style={{ color: "var(--primary)" }}
        >
          {line}
          {i === displayed.length - 1 && !done && <Cursor />}
        </p>
      ))}
    </div>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function Dots({ screen }: { screen: Screen }) {
  const active = typeof screen === "number" ? Math.min(screen, 4) : 4;
  return (
    <div className="flex items-center gap-2.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            height: 6,
            width: active >= i ? 22 : 6,
            background: active >= i ? "var(--accent)" : "#e7e5e4",
            transition: "width 0.4s ease, background 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Trust icons ─────────────────────────────────────────────────────────────
const TRUST_ICONS = [
  <svg key="lock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>,
  <svg key="shield" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
  <svg key="check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>,
];

const TRUST_COPY = [
  "We never share your information unless you explicitly ask us to",
  "Your data is encrypted and secured beyond most hospital-grade standards",
  "We are fully compliant with all relevant health data regulations",
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { setConditions: setContextConditions, setOnboardingCompleted, setDocuments: setContextDocuments, setIsCustodian: setContextIsCustodian, setPatientName: setContextPatientName, setUserName } = usePoppyContext();
  const [screen, setScreen]               = useState<Screen>(1);
  const [firstName, setFirstName]         = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [trustVisible, setTrustVisible]   = useState(0);
  const [tosVisible, setTosVisible]       = useState(false);
  const [uploadedDocIds, setUploadedDocIds]       = useState<string[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [uploading, setUploading]               = useState(false);
  const [currentlyUploading, setCurrentlyUploading] = useState<string | null>(null);
  const [failedFiles, setFailedFiles]           = useState<{ name: string; error: string }[]>([]);
  const [dragOver, setDragOver]                 = useState(false);
  const [confirmedConditions, setConfirmedConditions] = useState<string[]>([]);
  const [inferNotice, setInferNotice] = useState<"found" | "none" | null>(null);
  const [inferredPatientName, setInferredPatientName] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [selectedRole, setSelectedRole] = useState<"patient" | "family" | "nonFamily" | null>(null);
  const [patientNameInput, setPatientNameInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load profile — redirect if already onboarded
  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        if (r.status === 401) { router.replace("/login"); return; }
        const { profile } = await r.json();
        if (profile?.onboarding_completed) { router.replace("/dashboard"); return; }
        const raw: string = profile?.name ?? "";
        setFirstName(raw.split(" ")[0] ?? "");
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Typewriter instances
  const s1 = useTypewriter(
    profileLoaded && screen === 1
      ? [firstName ? `Welcome, ${firstName}.` : "Welcome.", "Poppy is about to become your most personal health companion."]
      : []
  );
  const s2 = useTypewriter(
    screen === 2
      ? ["Everything you see on Poppy is verified by our team of medical and care experts.", "No AI guesswork. Real knowledge, curated for you."]
      : []
  );
  const s3 = useTypewriter(screen === 3 ? ["Your documents never leave your control."] : []);
  const s4 = useTypewriter(
    screen === 4
      ? ["Now, let us build your 360° picture.", "Upload any medical documents you have — test results, letters, scans, prescriptions, anything.", "Just upload them and leave the rest to us."]
      : []
  );
  const sConfirm = useTypewriter(
    screen === "confirm"
      ? [inferNotice === "found"
          ? "Here's what we found in your documents."
          : "We couldn't automatically detect conditions — please add them manually."]
      : []
  );
  const sConditions = useTypewriter(
    screen === "conditions" ? ["What condition are you managing?"] : []
  );
  const sRole = useTypewriter(
    screen === "role" ? ["One last thing."] : []
  );
  const s5 = useTypewriter(
    screen === 5
      ? [firstName ? `You're all set, ${firstName}.` : "You're all set.", "Your personalised experience is ready."]
      : []
  );

  // ── Auto-advance: 1 → 2
  useEffect(() => {
    if (screen !== 1 || !s1.done) return;
    const t = setTimeout(() => setScreen(2), 1500);
    return () => clearTimeout(t);
  }, [screen, s1.done]);

  // ── Auto-advance: 2 → 3
  useEffect(() => {
    if (screen !== 2 || !s2.done) return;
    const t = setTimeout(() => setScreen(3), 1500);
    return () => clearTimeout(t);
  }, [screen, s2.done]);

  // ── Screen 3: reveal trust points, then show ToS (no auto-advance — user must accept)
  useEffect(() => {
    if (screen !== 3 || !s3.done) return;
    const timers = [
      setTimeout(() => setTrustVisible(1), 400),
      setTimeout(() => setTrustVisible(2), 950),
      setTimeout(() => setTrustVisible(3), 1500),
      setTimeout(() => setTosVisible(true), 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, [screen, s3.done]);

  useEffect(() => {
    if (screen !== 3) { setTrustVisible(0); setTosVisible(false); }
  }, [screen]);

  // ── Auto-redirect on screen 5
  useEffect(() => {
    if (screen !== 5 || !s5.done) return;
    const t = setTimeout(() => router.push("/dashboard"), 2000);
    return () => clearTimeout(t);
  }, [screen, s5.done]);

  // ── File upload: each file is independent — one failure never blocks the others
  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    setFailedFiles([]);

    const newDocIds: string[] = [];
    const newFileNames: string[] = [];
    const failures: { name: string; error: string }[] = [];

    for (const file of arr) {
      setCurrentlyUploading(file.name);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/documents", { method: "POST", body: fd });
        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string };
          failures.push({ name: file.name, error: json.error ?? "Upload failed" });
        } else {
          const { document: doc } = await res.json() as { document: { id: string; name: string } };
          newDocIds.push(doc.id);
          newFileNames.push(file.name);
        }
      } catch {
        failures.push({ name: file.name, error: "Upload failed" });
      }
    }

    setCurrentlyUploading(null);
    if (failures.length > 0) setFailedFiles(failures);

    if (newDocIds.length > 0) {
      setUploadedDocIds((p) => [...p, ...newDocIds]);
      setUploadedFileNames((p) => [...p, ...newFileNames]);
      // Sync to PoppyContext so GeneralContentBanner knows docs exist
      setContextDocuments((p) => [...p, ...newDocIds.map((id, i) => ({ id, name: newFileNames[i] }))]);
      await inferConditionsFromDocs([...uploadedDocIds, ...newDocIds]);
    } else {
      // Every file failed — stay on upload screen so user can retry
      setUploading(false);
    }
  }

  async function inferConditionsFromDocs(docIds: string[]) {
    setUploading(false);
    setScreen("analyzing");
    try {
      const res = await fetch("/api/onboarding/infer-conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: docIds }),
      });
      const data = await res.json() as { conditions: string[]; patientName: string | null };
      const found = Array.isArray(data.conditions) && data.conditions.length > 0;
      setConfirmedConditions(found ? data.conditions : []);
      setInferNotice(found ? "found" : "none");
      // Pre-fill patient name if found in documents
      if (data.patientName) {
        setInferredPatientName(data.patientName);
        setPatientNameInput(data.patientName);
      }
    } catch {
      setConfirmedConditions([]);
      setInferNotice("none");
    }
    setScreen("confirm");
  }

  // ── Skip upload: go to manual condition selection
  function handleSkip() {
    setConfirmedConditions([]);
    setScreen("conditions");
  }

  // ── Final save: persist conditions + role + onboarding_completed ────────────
  async function finishOnboarding(
    conditions: string[],
    roleData: { is_custodian: boolean; patient_name?: string; name?: string },
    loc?: { text: string; data: { lat: number; lng: number } | null }
  ) {
    setSaving(true);
    setSaveError("");
    try {
      // PROFILE WRITE — triggered by: user clicking "Continue →" on the role screen.
      // The only write in the onboarding flow.
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditions,
          onboarding_completed: true,
          is_custodian: roleData.is_custodian,
          ...(roleData.name        ? { name: roleData.name }               : {}),
          ...(roleData.patient_name ? { patient_name: roleData.patient_name } : {}),
          ...(loc?.text ? { location: loc.text } : {}),
          ...(loc?.data ? { location_lat: loc.data.lat, location_lng: loc.data.lng } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Poppy] Profile save failed during onboarding:", body.error);
        // Do NOT advance — let the user retry so onboarding_completed is persisted.
        setSaveError(`Could not save your profile: ${body.error ?? "unknown error"}`);
        setSaving(false);
        return;
      }

      console.log("[Poppy] Onboarding save succeeded.");
    } catch (err) {
      console.error("[Poppy] Network error during onboarding profile save:", err);
      setSaveError("Network error. Please check your connection and try again.");
      setSaving(false);
      return;
    }

    // Only reach here on success — update in-memory context then advance.
    setContextConditions(conditions);
    setOnboardingCompleted(true);
    setContextIsCustodian(roleData.is_custodian);
    if (roleData.name) setUserName(roleData.name);
    if (roleData.patient_name) setContextPatientName(roleData.patient_name);
    setSaving(false);
    setScreen(5);
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
      <style>{`
        @keyframes onbFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .onb-enter { animation: onbFadeUp 0.5s ease-out both; }
        @keyframes onbSpin {
          to { transform: rotate(360deg); }
        }
        .onb-spin { animation: onbSpin 0.9s linear infinite; }
      `}</style>

      {/* ── Content ── */}
      <div className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 overflow-y-auto py-12">
        <div className="max-w-2xl w-full">

          {/* Screen 1 — Welcome */}
          {screen === 1 && (
            <div className="onb-enter">
              <TypedText displayed={s1.displayed} done={s1.done} />
            </div>
          )}

          {/* Screen 2 — The promise */}
          {screen === 2 && (
            <div className="onb-enter">
              <TypedText displayed={s2.displayed} done={s2.done} />
            </div>
          )}

          {/* Screen 3 — Your data + ToS */}
          {screen === 3 && (
            <div className="onb-enter flex flex-col gap-10">
              <TypedText displayed={s3.displayed} done={s3.done} />
              <div className="flex flex-col gap-5">
                {TRUST_COPY.map((text, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4"
                    style={{
                      opacity: trustVisible > i ? 1 : 0,
                      transform: trustVisible > i ? "translateY(0)" : "translateY(10px)",
                      transition: "opacity 0.5s ease, transform 0.5s ease",
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--soft)", color: "var(--accent)", marginTop: 2 }}
                    >
                      {TRUST_ICONS[i]}
                    </span>
                    <p className="text-base text-stone-500 leading-relaxed pt-0.5">{text}</p>
                  </div>
                ))}
              </div>

              {/* ToS acceptance — appears after trust points, blocks auto-advance */}
              {tosVisible && (
                <div
                  className="flex flex-col gap-5 pt-6"
                  style={{
                    borderTop: "1px solid var(--soft)",
                    animation: "onbFadeUp 0.5s ease-out both",
                  }}
                >
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Before we continue, please review and accept our{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline underline-offset-2 hover:opacity-75 transition-opacity"
                      style={{ color: "var(--accent)" }}
                    >
                      Terms of Service
                    </a>
                    . By continuing you confirm that you have read and agree to the terms, including
                    how we handle your health data.
                  </p>
                  <button
                    onClick={() => setScreen(4)}
                    className="self-start px-7 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--accent)" }}
                  >
                    I agree — continue →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Screen 4 — Upload */}
          {screen === 4 && (
            <div className="onb-enter flex flex-col gap-8">
              <TypedText displayed={s4.displayed} done={s4.done} />
              {s4.done && (
                <div className="flex flex-col gap-5" style={{ animation: "onbFadeUp 0.5s ease-out both" }}>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileRef.current?.click()}
                    className="rounded-3xl p-10 flex flex-col items-center gap-5 cursor-pointer border-2 border-dashed transition-colors"
                    style={{
                      borderColor: dragOver ? "var(--accent)" : "#d4c4b0",
                      background: dragOver ? "var(--soft)" : "transparent",
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--soft)", color: "var(--accent)" }}>
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-medium" style={{ color: "var(--primary)" }}>
                        {currentlyUploading
                          ? `Uploading ${currentlyUploading}…`
                          : "Drag your files here"}
                      </p>
                      <p className="text-sm text-stone-400 mt-1">PDF or TXT · up to 10 MB each · select multiple</p>
                    </div>
                    {!uploading && (
                      <button
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "var(--accent)" }}
                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      >
                        Browse files
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" multiple accept=".pdf,.txt" className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)} />

                  {/* Per-file status */}
                  {(uploadedFileNames.length > 0 || failedFiles.length > 0) && (
                    <div className="flex flex-col gap-1.5">
                      {uploadedFileNames.map((name, i) => (
                        <p key={i} className="flex items-center gap-2 text-sm text-stone-500">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {name}
                        </p>
                      ))}
                      {failedFiles.map((f, i) => (
                        <p key={i} className="flex items-start gap-2 text-sm" style={{ color: "#dc2626" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span><span className="font-medium">{f.name}</span> — {f.error}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleSkip}
                    className="self-center text-sm text-stone-400 hover:text-stone-600 transition-colors mt-1"
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    Skip for now — I&apos;ll choose my conditions manually
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Screen "analyzing" — AI reading documents */}
          {screen === "analyzing" && (
            <div className="onb-enter flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <svg className="onb-spin flex-shrink-0" width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                <p className="text-3xl sm:text-4xl font-light tracking-tight" style={{ color: "var(--primary)" }}>
                  Reading your documents…
                </p>
              </div>
              <p className="text-base text-stone-400">
                We&apos;re identifying your conditions. This will only take a moment.
              </p>
            </div>
          )}

          {/* Screen "confirm" — Confirm inferred conditions */}
          {screen === "confirm" && (
            <div className="onb-enter flex flex-col gap-8">
              <TypedText displayed={sConfirm.displayed} done={sConfirm.done} />
              {sConfirm.done && (
                <div className="flex flex-col gap-6" style={{ animation: "onbFadeUp 0.5s ease-out both" }}>
                  {inferNotice === "none" && (
                    <p className="text-sm text-stone-400">
                      You can search and add your conditions below.
                    </p>
                  )}
                  <ConditionSelector
                    selected={confirmedConditions}
                    onChange={setConfirmedConditions}
                  />
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setScreen("role")}
                      disabled={confirmedConditions.length === 0}
                      className="px-7 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      style={{ background: "var(--accent)" }}
                    >
                      {confirmedConditions.length > 0 ? "Confirm and continue →" : "Add at least one condition"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Screen "conditions" — Manual condition selection (skip path) */}
          {screen === "conditions" && (
            <div className="onb-enter flex flex-col gap-8">
              <TypedText displayed={sConditions.displayed} done={sConditions.done} />
              {sConditions.done && (
                <div className="flex flex-col gap-6" style={{ animation: "onbFadeUp 0.5s ease-out both" }}>
                  <ConditionSelector
                    selected={confirmedConditions}
                    onChange={setConfirmedConditions}
                  />
                  <button
                    onClick={() => setScreen("role")}
                    disabled={confirmedConditions.length === 0}
                    className="self-start px-7 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: "var(--accent)" }}
                  >
                    {confirmedConditions.length > 0 ? "Continue →" : "Add at least one condition"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Screen "role" — Who are you setting this up for? */}
          {screen === "role" && (
            <div className="onb-enter flex flex-col gap-8">
              <TypedText displayed={sRole.displayed} done={sRole.done} />
              {sRole.done && (
                <div className="flex flex-col gap-3" style={{ animation: "onbFadeUp 0.5s ease-out both" }}>
                  <p className="text-base text-stone-500 leading-relaxed -mt-2">
                    Who are you setting this account up for?
                  </p>

                  {/* Option 1 — Patient */}
                  <button
                    onClick={() => setSelectedRole("patient")}
                    className="text-left rounded-2xl p-5 border-2 transition-all hover:shadow-md"
                    style={{
                      background: selectedRole === "patient" ? "var(--soft)" : "transparent",
                      borderColor: selectedRole === "patient" ? "var(--accent)" : "#e7e5e4",
                    }}
                  >
                    <p className="font-semibold text-base" style={{ color: "var(--primary)" }}>
                      I am the patient
                    </p>
                    <p className="text-sm text-stone-400 mt-1">Setting this up for myself</p>
                  </button>

                  {/* Option 2 — Family guardian */}
                  <button
                    onClick={() => { setSelectedRole("family"); if (!inferredPatientName) setPatientNameInput(""); }}
                    className="text-left rounded-2xl p-5 border-2 transition-all hover:shadow-md"
                    style={{
                      background: selectedRole === "family" ? "var(--soft)" : "transparent",
                      borderColor: selectedRole === "family" ? "var(--accent)" : "#e7e5e4",
                    }}
                  >
                    <p className="font-semibold text-base" style={{ color: "var(--primary)" }}>
                      Family guardian / carer
                    </p>
                    <p className="text-sm text-stone-400 mt-1">Looking after a family member</p>
                  </button>

                  {/* Option 3 — Non-family guardian */}
                  <button
                    onClick={() => { setSelectedRole("nonFamily"); if (!inferredPatientName) setPatientNameInput(""); }}
                    className="text-left rounded-2xl p-5 border-2 transition-all hover:shadow-md"
                    style={{
                      background: selectedRole === "nonFamily" ? "var(--soft)" : "transparent",
                      borderColor: selectedRole === "nonFamily" ? "var(--accent)" : "#e7e5e4",
                    }}
                  >
                    <p className="font-semibold text-base" style={{ color: "var(--primary)" }}>
                      Non-family guardian / carer
                    </p>
                    <p className="text-sm text-stone-400 mt-1">Professional or non-family carer</p>
                  </button>

                  {/* Patient name input — shown for ALL roles so the name is always confirmed */}
                  {selectedRole !== null && (
                    <div
                      className="flex flex-col gap-4 pt-2"
                      style={{ animation: "onbFadeUp 0.35s ease-out both" }}
                    >
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--primary)" }}
                        >
                          {selectedRole === "patient" ? "Your name" : "Patient's name"}
                        </label>
                        {inferredPatientName && (
                          <p className="text-xs text-stone-400 mb-2">
                            Found in your documents — please confirm or edit.
                          </p>
                        )}
                        <input
                          type="text"
                          value={patientNameInput}
                          onChange={(e) => setPatientNameInput(e.target.value)}
                          placeholder={selectedRole === "patient" ? "Your full name" : "e.g. Ben Smith"}
                          autoFocus
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                          style={{
                            background: "var(--soft)",
                            color: "var(--foreground)",
                            border: "1px solid transparent",
                          }}
                        />
                      </div>
                      {saveError && (
                        <p className="text-sm" style={{ color: "#dc2626" }}>{saveError}</p>
                      )}
                      <button
                        onClick={() => {
                          const trimmed = patientNameInput.trim() || undefined;
                          const roleData = {
                            is_custodian: selectedRole !== "patient",
                            patient_name: trimmed,
                            // For patients, the input is their own name — write it to `name` too
                            ...(selectedRole === "patient" ? { name: trimmed } : {}),
                          };
                          finishOnboarding(confirmedConditions, roleData);
                        }}
                        disabled={!patientNameInput.trim() || saving}
                        className="self-start px-7 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                        style={{ background: "var(--accent)" }}
                      >
                        {saving ? "Saving…" : "Continue →"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Screen 5 — Done */}
          {screen === 5 && (
            <div className="onb-enter">
              <TypedText displayed={s5.displayed} done={s5.done} />
            </div>
          )}

        </div>
      </div>

      {/* ── Progress dots ── */}
      <div className="flex-shrink-0 pb-10 flex justify-center">
        <Dots screen={screen} />
      </div>
    </div>
  );
}
