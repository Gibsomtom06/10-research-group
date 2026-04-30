import { useState, useEffect, useRef, useMemo } from "react";

const DEMO_SHOWS = [
  { city: "Denver", state: "CO", venue: "Larimer Lounge", days: 39, phase: "ON-SALE", offer: 1500, rollout: 33, cpt: "$2.10" },
  { city: "Pittsburgh", state: "PA", venue: "SideQuest", days: 12, phase: "FINAL PUSH", offer: 2500, rollout: 67, cpt: "$1.85" },
  { city: "Austin", state: "TX", venue: "Courtyard ATX", days: 131, phase: "EVALUATING", offer: 2000, rollout: 0, cpt: "—" },
  { city: "Butte", state: "MT", venue: "Covellite Theatre", days: 62, phase: "ANNOUNCEMENT", offer: 5000, rollout: 17, cpt: "$0.90" },
  { city: "San Diego", state: "CA", venue: "TBD", days: 111, phase: "ANNOUNCEMENT", offer: 3000, rollout: 0, cpt: "—" },
];

const DEMO_OFFER = {
  city: "Austin, TX", venue: "The Courtyard ATX", capacity: 550, guarantee: "$2,000",
  bonus: "up to $4,000 walkout", deposit: "25% ($500)", radius: "150mi / 90 days",
  promoter: "Full Grind Entertainment", grade: "UNKNOWN",
};

const FEATURES = [
  { icon: "⚡", title: "Offer Intelligence", desc: "AI parses offer emails + contract PDFs. Floor check, CPT analysis, radius clause conflicts, routing optimization. Counter or approve in one click.", color: "#ef4444" },
  { icon: "📖", title: "Artist Bible", desc: "One living document per artist. Metrics, contacts, commissions, rate sheets, tour history, release cadence — always current.", color: "#a855f7" },
  { icon: "🗺️", title: "Tour Command", desc: "17-state show lifecycle. Offer → settlement. Every show tracked through announcement, on-sale, maintenance, final push, day-of.", color: "#22d3ee" },
  { icon: "💰", title: "Financial Engine", desc: "Commission splits in real time. Cost-per-ticket per show. Tour P&L. Know what every deal nets before you sign.", color: "#22c55e" },
  { icon: "📡", title: "Release Ops", desc: "DSP-specific tactics. Algorithmic triggers, editorial pitching, save campaigns, cadence enforcement. 6-week minimum rule.", color: "#f59e0b" },
  { icon: "🔔", title: "Smart Alerts", desc: "No contract 7 days out? Missing deposit? Ticket sales stalling? Radius conflict? You know before it's a crisis.", color: "#ef4444" },
];

function phaseColor(p) {
  return { "FINAL PUSH": "#ef4444", "ON-SALE": "#22d3ee", "ANNOUNCEMENT": "#a855f7", "EVALUATING": "#f59e0b", "COMPLETED": "#4a5568" }[p] || "#64748b";
}
function phaseBg(p) {
  return { "FINAL PUSH": "rgba(239,68,68,0.12)", "ON-SALE": "rgba(34,211,238,0.12)", "ANNOUNCEMENT": "rgba(168,85,247,0.12)", "EVALUATING": "rgba(245,158,11,0.12)" }[p] || "rgba(107,114,128,0.1)";
}

function DemoGrid() {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ background: "#080e1a", borderRadius: 8, border: "1px solid #1e293b", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e66" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Tour Command · Live</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#22c55e" }}>5 active shows</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "54px 1fr 100px 70px 60px 70px", padding: "6px 12px", fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace", gap: 8 }}>
        <span>Days</span><span>City / Venue</span><span>Phase</span><span>Offer</span><span>CPT</span><span>Rollout</span>
      </div>
      {DEMO_SHOWS.map((s, i) => (
        <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{
          display: "grid", gridTemplateColumns: "54px 1fr 100px 70px 60px 70px",
          padding: "10px 12px", background: hovered === i ? "#0f172a" : phaseBg(s.phase),
          borderLeft: `3px solid ${phaseColor(s.phase)}`, gap: 8, alignItems: "center",
          transition: "background 0.15s", cursor: "default", marginBottom: 1,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: s.days <= 14 ? "#ef4444" : "#94a3b8", fontWeight: s.days <= 14 ? 700 : 400 }}>{s.days}d</span>
          <div>
            <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 12 }}>{s.city}, {s.state}</span>
            <span style={{ color: "#64748b", fontSize: 10, marginLeft: 8 }}>{s.venue}</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 3, background: phaseColor(s.phase), color: "#0f172a", textAlign: "center", letterSpacing: "0.04em", fontFamily: "'JetBrains Mono', monospace" }}>{s.phase}</span>
          <span style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600 }}>${s.offer.toLocaleString()}</span>
          <span style={{ color: s.cpt === "—" ? "#475569" : "#22d3ee", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{s.cpt}</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ width: 40, height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${s.rollout}%`, height: "100%", background: s.rollout > 50 ? "#22c55e" : s.rollout > 0 ? "#f59e0b" : "#334155", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{s.rollout}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DemoOffer() {
  const [step, setStep] = useState(0);
  useEffect(() => { if (step < 6) { const t = setTimeout(() => setStep(s => s + 1), 800); return () => clearTimeout(t); } }, [step]);
  const steps = [
    { label: "FLOOR", status: "✓ PASS", color: "#22c55e", detail: "$2,000 > $1,500 min" },
    { label: "MARKET", status: "NEW", color: "#f59e0b", detail: "No previous Austin data" },
    { label: "CPT", status: "$1.91", color: "#22c55e", detail: "Below $3.00 threshold" },
    { label: "CALENDAR", status: "⚠ CONFLICT", color: "#ef4444", detail: "Houston 5/22 in radius" },
    { label: "PROMOTER", status: "UNKNOWN", color: "#f59e0b", detail: "Require 50% deposit" },
    { label: "MARKETING", status: "✗ MISSING", color: "#ef4444", detail: "No promoter ad spend" },
  ];
  return (
    <div style={{ background: "#080e1a", borderRadius: 8, border: "1px solid #1e293b", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Offer Intelligence · Evaluating</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#f59e0b" }}>COUNTER RECOMMENDED</span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Venue</div>
            <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{DEMO_OFFER.venue}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Cap: {DEMO_OFFER.capacity} · {DEMO_OFFER.city}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Deal</div>
            <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{DEMO_OFFER.guarantee}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{DEMO_OFFER.bonus}</div>
          </div>
        </div>
        <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>6-Step Analysis</div>
        <div style={{ display: "grid", gap: 3 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "80px 90px 1fr", padding: "6px 10px",
              background: i < step ? "#0f172a" : "#080e1a", borderLeft: `2px solid ${i < step ? s.color : "#1e293b"}`,
              borderRadius: 3, alignItems: "center", opacity: i < step ? 1 : 0.3, transition: "all 0.4s ease",
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#64748b", fontWeight: 700 }}>{s.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: s.color, fontWeight: 700 }}>{s.status}</span>
              <span style={{ fontSize: 10, color: "#64748b" }}>{s.detail}</span>
            </div>
          ))}
        </div>
        {step >= 6 && (
          <div style={{ display: "flex", gap: 8, marginTop: 16, animation: "fadeUp 0.4s ease" }}>
            {["COUNTER", "APPROVE", "CHECK DATE", "DECLINE"].map((a, i) => (
              <button key={i} style={{
                flex: 1, padding: "8px 0", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.06em", border: i === 0 ? "none" : "1px solid #1e293b", borderRadius: 4,
                background: i === 0 ? "#ef4444" : "transparent", color: i === 0 ? "#fafafa" : "#64748b", cursor: "pointer",
              }}>{a}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TENxLanding() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080e1a", color: "#e2e8f0", fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080e1a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanPulse { 0%, 100% { opacity: 0.03; } 50% { opacity: 0.06; } }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "12px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: scrollY > 50 ? "rgba(8,14,26,0.95)" : "transparent",
        borderBottom: scrollY > 50 ? "1px solid #1e293b" : "1px solid transparent",
        backdropFilter: scrollY > 50 ? "blur(12px)" : "none", transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>TEN</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, color: "#ef4444" }}>x</span>
        </div>
        <button onClick={() => document.getElementById("waitlist").scrollIntoView({ behavior: "smooth" })} style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: "8px 16px",
          border: "1px solid #a855f7", borderRadius: 4, background: "rgba(168,85,247,0.1)", color: "#a855f7",
          cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>Early Access</button>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 24px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse at 30% 50%, black 20%, transparent 60%)",
          animation: "scanPulse 4s ease-in-out infinite",
        }} />
        <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#a855f7", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 16, animation: "fadeUp 0.6s ease both" }}>// System Online</div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", animation: "fadeUp 0.6s ease 0.1s both" }}>
            <span style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TEN</span>
            <span style={{ color: "#ef4444" }}>x</span>
            <br /><span style={{ color: "#e2e8f0" }}>Multiply Your</span>
            <br /><span style={{ color: "#e2e8f0" }}>Career.</span>
          </h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, color: "#64748b", maxWidth: 500, lineHeight: 1.7, marginTop: 20, animation: "fadeUp 0.6s ease 0.3s both" }}>
            The AI operating system for music managers, booking agents, and artists who run their career like an actual business.
          </p>
          <div style={{ display: "flex", gap: 24, marginTop: 32, animation: "fadeUp 0.6s ease 0.5s both" }}>
            {[{ val: "6", label: "AI Agents" }, { val: "20", label: "Modules" }, { val: "17", label: "Show States" }, { val: "<60s", label: "Offer → Decision" }].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>{s.val}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALERT BAR */}
      <div style={{ background: "rgba(168,85,247,0.06)", borderTop: "1px solid #1e293b", borderBottom: "1px solid #1e293b", padding: "10px 24px", display: "flex", alignItems: "center", gap: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, overflow: "hidden" }}>
        <span style={{ color: "#a855f7", fontWeight: 700, whiteSpace: "nowrap" }}>▸ WHAT IT DOES</span>
        <span style={{ color: "#64748b" }}>Parses offer emails + PDFs automatically</span>
        <span style={{ color: "#475569" }}>·</span>
        <span style={{ color: "#64748b" }}>Runs 6-step decision engine</span>
        <span style={{ color: "#475569" }}>·</span>
        <span style={{ color: "#64748b" }}>Tracks every show offer to settlement</span>
        <span style={{ color: "#475569" }}>·</span>
        <span style={{ color: "#64748b" }}>Drafts replies in one click</span>
      </div>

      {/* DEMO: TOUR GRID */}
      <section style={{ padding: "60px 24px", maxWidth: 950, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#22d3ee", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>// Tour Command</div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Every show. Every dollar. Every phase.</h2>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#64748b", marginBottom: 24, maxWidth: 550 }}>Your entire tour in one grid. Phase tracking, rollout checklists, financial breakdowns, smart alerts — all updating in real time.</p>
        <DemoGrid />
      </section>

      {/* DEMO: OFFER EVALUATOR */}
      <section style={{ padding: "60px 24px", maxWidth: 950, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#ef4444", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>// Offer Intelligence</div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Offer lands. AI runs the numbers. You decide.</h2>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#64748b", marginBottom: 24, maxWidth: 550 }}>Six-step analysis in under 60 seconds. Floor check, market history, cost-per-ticket, radius conflicts, promoter vetting. Then one click.</p>
        <DemoOffer />
      </section>

      {/* FEATURES */}
      <section style={{ padding: "60px 24px", maxWidth: 950, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#a855f7", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>// The Platform</div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: "#e2e8f0", marginBottom: 24 }}>Six engines. One system.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 2, background: "#1e293b", borderRadius: 8, overflow: "hidden" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: 24, background: "#080e1a", borderLeft: `3px solid ${f.color}`, cursor: "default" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{f.title}</span>
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "60px 24px", maxWidth: 950, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#22c55e", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>// Pipeline</div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: "#e2e8f0", marginBottom: 24 }}>Inbox to decision in 60 seconds.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { num: "01", title: "Offer detected", desc: "AI monitors your inbox. Parses email body + contract PDF. Extracts every term.", color: "#a855f7" },
            { num: "02", title: "Engine runs", desc: "6-step analysis. Floor, market, CPT, routing, promoter grade, marketing audit.", color: "#22d3ee" },
            { num: "03", title: "You decide", desc: "Accept, counter, check date, or decline. Terms pre-filled. Reply drafted. One click.", color: "#22c55e" },
            { num: "04", title: "Show tracked", desc: "Flows into Tour Command. 17 lifecycle states. P&L in real time. Alerts catch problems.", color: "#ef4444" },
          ].map((s, i) => (
            <div key={i} style={{ padding: 20, background: "#0c1222", borderRadius: 6, borderTop: `2px solid ${s.color}` }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800, color: s.color + "33", marginBottom: 8 }}>{s.num}</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <section style={{ padding: "40px 24px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 300, color: "#94a3b8", lineHeight: 1.7, fontStyle: "italic" }}>
          "Every manager runs on spreadsheets, text threads, and gut feeling. We built the system that replaces all three."
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" style={{ padding: "60px 24px", maxWidth: 500, margin: "0 auto" }}>
        <div style={{ background: "#0c1222", borderRadius: 8, border: "1px solid #1e293b", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 6px #a855f766" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Early Access · Beta</span>
          </div>
          <div style={{ padding: 24 }}>
            {!submitted ? (
              <>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Get in before launch.</h3>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "#64748b", marginBottom: 20 }}>Onboarding beta testers now. Managers, agents, and artists who are done running their career on hope.</p>
                <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>I am a...</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {["Manager", "Booking Agent", "Artist", "Label / A&R"].map(r => (
                    <button key={r} onClick={() => setRole(r)} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, padding: "6px 14px",
                      borderRadius: 4, cursor: "pointer", border: role === r ? "1px solid #a855f7" : "1px solid #1e293b",
                      background: role === r ? "rgba(168,85,247,0.15)" : "transparent",
                      color: role === r ? "#a855f7" : "#64748b", transition: "all 0.2s",
                    }}>{r}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && email && role && setSubmitted(true)}
                    style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "10px 14px", border: "1px solid #1e293b", borderRadius: 4, background: "#080e1a", color: "#e2e8f0", outline: "none" }} />
                  <button onClick={() => email && role && setSubmitted(true)} disabled={!email || !role}
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: "10px 20px", border: "none", borderRadius: 4, background: email && role ? "#a855f7" : "#1e293b", color: email && role ? "#080e1a" : "#475569", cursor: email && role ? "pointer" : "not-allowed", letterSpacing: "0.08em" }}>JOIN</button>
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#334155", marginTop: 10 }}>No spam. Beta invites go out in waves.</p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", animation: "fadeUp 0.4s ease" }}>
                <div style={{ fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 3, background: "#22c55e", color: "#080e1a", display: "inline-block", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", marginBottom: 12 }}>CONFIRMED</div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>You're on the list.</div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "#64748b", marginTop: 4 }}>We'll reach out when your beta slot opens.</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer style={{ padding: 24, textAlign: "center", borderTop: "1px solid #1e293b" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#334155", letterSpacing: "0.05em" }}>© 2026 TENx · Built for the music industry</div>
      </footer>
    </div>
  );
}
