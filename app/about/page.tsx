import Link from "next/link";

function PoppyFlowerSVG({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="32" cy="18" rx="9" ry="16" fill="#E07850" opacity="0.92" />
      <ellipse cx="32" cy="46" rx="9" ry="16" fill="#E07850" opacity="0.92" />
      <ellipse cx="18" cy="32" rx="16" ry="9" fill="#C95E35" opacity="0.85" />
      <ellipse cx="46" cy="32" rx="16" ry="9" fill="#C95E35" opacity="0.85" />
      <ellipse cx="21" cy="21" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(-45 21 21)" />
      <ellipse cx="43" cy="21" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(45 43 21)" />
      <ellipse cx="21" cy="43" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(45 21 43)" />
      <ellipse cx="43" cy="43" rx="9" ry="15" fill="#D96840" opacity="0.75" transform="rotate(-45 43 43)" />
      <circle cx="32" cy="32" r="9" fill="#2C1810" />
      <circle cx="29" cy="29" r="1.2" fill="#5C3820" />
      <circle cx="32" cy="28" r="1.2" fill="#5C3820" />
      <circle cx="35" cy="29" r="1.2" fill="#5C3820" />
      <circle cx="30" cy="32" r="1.2" fill="#5C3820" />
      <circle cx="34" cy="32" r="1.2" fill="#5C3820" />
      <circle cx="32" cy="35" r="1.2" fill="#5C3820" />
    </svg>
  );
}

function BotanicalBlob({ size = 200, color = "#D9542B", opacity = 0.08, style }: {
  size?: number; color?: string; opacity?: number; style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={style} aria-hidden="true">
      <g opacity={opacity}>
        <ellipse cx="100" cy="55"  rx="22" ry="55" fill={color} />
        <ellipse cx="100" cy="145" rx="22" ry="55" fill={color} />
        <ellipse cx="55"  cy="100" rx="55" ry="22" fill={color} />
        <ellipse cx="145" cy="100" rx="55" ry="22" fill={color} />
        <ellipse cx="64"  cy="64"  rx="15" ry="42" fill={color} transform="rotate(-45 64 64)" />
        <ellipse cx="136" cy="64"  rx="15" ry="42" fill={color} transform="rotate(45 136 64)" />
        <ellipse cx="64"  cy="136" rx="15" ry="42" fill={color} transform="rotate(45 64 136)" />
        <ellipse cx="136" cy="136" rx="15" ry="42" fill={color} transform="rotate(-45 136 136)" />
      </g>
    </svg>
  );
}

const serif = "'Newsreader', 'Lora', Georgia, serif";
const mono  = "'Geist Mono', ui-monospace, monospace";

const FEATURES = [
  {
    num: "01",
    title: "understand.",
    body: "Poppy reads your medical documents — genetics reports, discharge letters, scan results — and translates them into plain language you can actually use. Highlight what matters. Ask anything, any time.",
    tag: "documents · learn",
    accent: "#D9542B",
  },
  {
    num: "02",
    title: "connect.",
    body: "Find specialists who genuinely treat your condition, not just a nearby GP. See community conversations from patients walking the same road — today, in real time.",
    tag: "specialists · community",
    accent: "#7C8E6B",
  },
  {
    num: "03",
    title: "belong.",
    body: "Your full health story, written in one place. Share it with your medical team in a single click. Bring clinical trials and emerging research into your orbit.",
    tag: "story · trials",
    accent: "#B07E2C",
  },
];

const HOW_IT_WORKS = [
  { step: "01", heading: "Upload a document", detail: "A genetics panel, a discharge letter, an MRI report. Even one document is enough to get started." },
  { step: "02", heading: "Poppy reads it",     detail: "She extracts your conditions, medications, and key findings — privately, on your behalf." },
  { step: "03", heading: "Your hub comes alive", detail: "Relevant trials, matching specialists, community voices, and plain-language explanations appear around you." },
  { step: "04", heading: "Ask anything",       detail: "The question you've been afraid to ask out loud. Poppy answers it carefully, with your own documents as the source." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--background)", color: "var(--ink)", fontFamily: serif, position: "relative", overflowX: "hidden" }}>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav style={{
        display: "flex", alignItems: "center", padding: "18px 52px",
        borderBottom: "1px solid var(--rule)", background: "var(--background)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <PoppyFlowerSVG size={24} />
          <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: 20, color: "var(--ink)", letterSpacing: "-0.01em" }}>poppy</span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/login" style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "var(--ink-soft)", textDecoration: "none" }}>sign in</Link>
          <Link href="/signup" style={{
            fontFamily: serif, fontStyle: "italic", fontSize: 14,
            color: "var(--poppy)", background: "var(--paper)",
            border: "1px solid rgba(217,84,43,0.28)",
            padding: "9px 18px", borderRadius: 999, textDecoration: "none",
          }}>create an account</Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 52px 72px", position: "relative" }}>
        <BotanicalBlob size={440} color="#D9542B" opacity={0.05} style={{ position: "absolute", top: -120, right: -160, pointerEvents: "none" }} />

        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--poppy)", display: "block", marginBottom: 24 }}>
          · a companion for rare disease ·
        </span>

        <h1 style={{
          fontFamily: serif, fontSize: "clamp(2.8rem, 5vw, 4.5rem)", lineHeight: 1.04,
          fontWeight: 400, letterSpacing: "-0.018em", color: "var(--ink)",
          margin: "0 0 28px", maxWidth: 760,
        }}>
          You are <em style={{ color: "var(--poppy)" }}>not</em> alone<br />in this.
        </h1>

        <p style={{
          fontFamily: serif, fontSize: "clamp(1rem, 1.5vw, 1.2rem)", lineHeight: 1.65,
          color: "var(--ink-soft)", maxWidth: 560, margin: "0 0 40px", fontWeight: 400,
        }}>
          Poppy is a tender, knowledgeable companion for anyone living with — or caring for someone with — a rare or complex condition. Built from your documents, your symptoms, your story.
        </p>

        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={{
            fontFamily: serif, fontStyle: "italic", fontSize: 16,
            color: "var(--poppy)", background: "var(--paper)",
            border: "1px solid rgba(217,84,43,0.28)",
            padding: "13px 24px", borderRadius: 999, textDecoration: "none",
            boxShadow: "0 8px 24px -10px rgba(217,84,43,0.22)",
          }}>begin your story →</Link>
          <Link href="/login" style={{
            fontFamily: serif, fontStyle: "italic", fontSize: 15,
            color: "var(--ink-soft)", textDecoration: "none",
            borderBottom: "1px solid var(--rule)", paddingBottom: 2,
          }}>already have an account</Link>
        </div>
      </section>

      {/* ── What Poppy does ───────────────────────────────────────────── */}
      <section style={{ padding: "72px 52px", borderTop: "1px solid var(--rule)", background: "var(--soft)", position: "relative" }}>
        <BotanicalBlob size={300} color="#7C8E6B" opacity={0.08} style={{ position: "absolute", bottom: -80, left: -80, pointerEvents: "none" }} />

        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-faded)", display: "block", marginBottom: 16 }}>
          02 · what poppy does
        </span>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(1.8rem, 3vw, 2.8rem)", lineHeight: 1.1, margin: "0 0 12px", fontWeight: 400, color: "var(--ink)", maxWidth: 680 }}>
          Everything you need, gathered <em>tenderly</em> around your particular condition.
        </h2>
        <p style={{ fontFamily: serif, fontSize: "1.05rem", color: "var(--ink-soft)", maxWidth: 580, lineHeight: 1.6, margin: "0 0 56px" }}>
          Upload a single document — a discharge letter, a genetics report — and Poppy quietly builds the rest. Tailored to you, never generic.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {FEATURES.map((f) => (
            <article key={f.num} style={{
              background: "var(--paper)", padding: "30px 28px", borderRadius: 18,
              border: "1px solid var(--rule)", display: "flex", flexDirection: "column", gap: 16,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: `${f.accent}1a`, display: "flex", alignItems: "center", justifyContent: "center", color: f.accent, fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: 13 }}>
                {f.num}
              </div>
              <h3 style={{ fontFamily: serif, fontStyle: "italic", fontSize: 28, fontWeight: 400, margin: 0, color: "var(--ink)", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontFamily: serif, fontSize: "0.95rem", lineHeight: 1.6, color: "var(--ink-soft)", margin: 0 }}>{f.body}</p>
              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px dashed var(--rule)" }}>
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: f.accent }}>{f.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section style={{ padding: "72px 52px", borderTop: "1px solid var(--rule)" }}>
        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-faded)", display: "block", marginBottom: 16 }}>
          03 · how it works
        </span>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(1.8rem, 3vw, 2.8rem)", lineHeight: 1.1, margin: "0 0 52px", fontWeight: 400, color: "var(--ink)", maxWidth: 600 }}>
          One quiet step,<br /><em>at your own pace.</em>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 2 }}>
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} style={{
              padding: "28px 24px",
              borderLeft: i === 0 ? "none" : "1px solid var(--rule)",
            }}>
              <span style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--poppy)", display: "block", marginBottom: 14 }}>{item.step}</span>
              <h3 style={{ fontFamily: serif, fontStyle: "italic", fontSize: 20, fontWeight: 400, margin: "0 0 10px", color: "var(--ink)" }}>{item.heading}</h3>
              <p style={{ fontFamily: serif, fontSize: "0.9rem", lineHeight: 1.6, color: "var(--ink-soft)", margin: 0 }}>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who it's for ──────────────────────────────────────────────── */}
      <section style={{ padding: "72px 52px", borderTop: "1px solid var(--rule)", background: "var(--soft)" }}>
        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-faded)", display: "block", marginBottom: 16 }}>
          04 · who it&apos;s for
        </span>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(1.8rem, 3vw, 2.8rem)", lineHeight: 1.1, margin: "0 0 40px", fontWeight: 400, color: "var(--ink)", maxWidth: 600 }}>
          For patients, and for those<br />who <em>love</em> them.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { title: "If you have a rare condition", body: "Poppy learns your specific diagnosis, reads your actual reports, and helps you understand what they mean — in language meant for a human being, not a clinician." },
            { title: "If you care for someone",      body: "As a parent, partner, or guardian, you carry the weight of someone else's illness too. Poppy is here for you as much as for the person you're caring for." },
            { title: "If you're still seeking answers", body: "Living undiagnosed is one of the hardest places to be. Poppy helps you organise what you know, find relevant specialists, and navigate the uncertainty." },
          ].map((c, i) => (
            <div key={i} style={{ padding: "24px 0", borderTop: "2px solid var(--rule)" }}>
              <h3 style={{ fontFamily: serif, fontStyle: "italic", fontSize: 19, fontWeight: 400, margin: "0 0 12px", color: "var(--ink)" }}>{c.title}</h3>
              <p style={{ fontFamily: serif, fontSize: "0.9rem", lineHeight: 1.65, color: "var(--ink-soft)", margin: 0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Privacy ───────────────────────────────────────────────────── */}
      <section style={{ padding: "64px 52px", borderTop: "1px solid var(--rule)" }}>
        <div style={{ maxWidth: 640 }}>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-faded)", display: "block", marginBottom: 16 }}>
            05 · privacy & trust
          </span>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(1.6rem, 2.5vw, 2.4rem)", lineHeight: 1.1, margin: "0 0 20px", fontWeight: 400, color: "var(--ink)" }}>
            Your data stays <em>yours.</em>
          </h2>
          <p style={{ fontFamily: serif, fontSize: "1rem", lineHeight: 1.7, color: "var(--ink-soft)", margin: "0 0 16px" }}>
            Poppy never sells, shares, or trains on your personal medical information. Your documents are encrypted at rest and in transit. You can delete everything at any time.
          </p>
          <p style={{ fontFamily: serif, fontSize: "1rem", lineHeight: 1.7, color: "var(--ink-soft)", margin: 0 }}>
            We built Poppy because someone we love went through this. Privacy isn&apos;t a policy checkbox for us — it&apos;s a promise.
          </p>
        </div>
      </section>

      {/* ── Testimonials placeholder ──────────────────────────────────── */}
      <section style={{ padding: "72px 52px", borderTop: "1px solid var(--rule)", background: "var(--soft)" }}>
        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-faded)", display: "block", marginBottom: 16 }}>
          06 · from the community
        </span>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(1.6rem, 2.5vw, 2.4rem)", lineHeight: 1.1, margin: "0 0 12px", fontWeight: 400, color: "var(--ink)" }}>
          Voices from people<br /><em>walking this road.</em>
        </h2>
        <p style={{ fontFamily: serif, fontSize: "0.95rem", color: "var(--ink-faded)", margin: "0 0 48px", fontStyle: "italic" }}>
          Stories from our community, coming soon.
        </p>
        {/* Testimonial cards — placeholder grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              background: "var(--paper)", borderRadius: 16, padding: "28px 24px",
              border: "1px solid var(--rule)", minHeight: 160,
              display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 16,
            }}>
              {/* Placeholder lines */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                {[80, 100, 70].map((w, j) => (
                  <div key={j} style={{ height: 12, borderRadius: 6, background: "var(--soft)", width: `${w}%` }} />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: "1px dashed var(--rule)" }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--soft)" }} />
                <div style={{ height: 10, width: 100, borderRadius: 5, background: "var(--soft)" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 52px", background: "var(--ink)", color: "var(--background)",
        textAlign: "center", position: "relative", overflow: "hidden",
        borderTop: "1px solid var(--rule)",
      }}>
        <BotanicalBlob size={480} color="#D9542B" opacity={0.07} style={{ position: "absolute", top: "-40%", left: "50%", transform: "translateX(-50%)" }} />
        <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#E89A8B", display: "block", marginBottom: 20 }}>begin</span>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(2rem, 4vw, 3.8rem)", lineHeight: 1.05, margin: "0 0 32px", fontWeight: 400, color: "var(--background)", letterSpacing: "-0.02em" }}>
          One quiet step,<br /><em style={{ color: "#E89A8B" }}>at your own pace.</em>
        </h2>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={{
            fontFamily: serif, fontStyle: "italic", fontSize: 16,
            color: "var(--ink)", background: "var(--paper)",
            border: "none",
            padding: "13px 28px", borderRadius: 999, textDecoration: "none",
          }}>begin your story</Link>
          <Link href="/login" style={{
            fontFamily: serif, fontStyle: "italic", fontSize: 16, color: "var(--background)",
            background: "transparent", border: "1px solid rgba(251,246,238,0.3)",
            padding: "13px 28px", borderRadius: 999, textDecoration: "none",
          }}>sign in</Link>
        </div>
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13, color: "rgba(251,246,238,0.45)", marginTop: 28 }}>
          your data stays yours · private by default
        </p>
      </section>
    </div>
  );
}
