import { useState, useEffect, useRef } from "react";

// ─── THEME ───────────────────────────────────────────────────────
const C = {
  bg:       "#07040F",
  bg2:      "#0F0820",
  bg3:      "#18103A",
  card:     "#130D28",
  border:   "#2A1D5C",
  purple:   "#7B2FBE",
  purpleL:  "#A855F7",
  cyan:     "#00D4FF",
  cyanD:    "#0099CC",
  green:    "#00E676",
  red:      "#FF3D57",
  amber:    "#FFAB00",
  white:    "#EDE8FF",
  grey:     "#6B5E8C",
  greyL:    "#9B8EC4",
};

// ─── FONTS via style injection ────────────────────────────────────
const FONT_INJECT = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; background: ${C.bg2}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes sweep { from{width:0} to{width:100%} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 8px #7B2FBE44} 50%{box-shadow:0 0 24px #7B2FBE88} }
`;

// ─── TINY COMPONENTS ─────────────────────────────────────────────

function Label({ children, color = C.grey, size = 9, tracking = 2 }) {
  return (
    <span style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: size, color, letterSpacing: tracking,
      textTransform: "uppercase"
    }}>{children}</span>
  );
}

function Value({ children, color = C.cyan, size = 28 }) {
  return (
    <span style={{
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: size, fontWeight: 700, color, lineHeight: 1
    }}>{children}</span>
  );
}

function Card({ children, accent = C.purple, style: s = {}, glow = false }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${accent}44`,
      borderRadius: 10,
      padding: "18px 20px",
      position: "relative",
      overflow: "hidden",
      animation: glow ? "glow 3s ease-in-out infinite" : "none",
      ...s
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${accent}BB 50%, transparent 100%)`
      }} />
      {children}
    </div>
  );
}

function SectionTitle({ children, accent = C.purpleL }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, background: accent, borderRadius: 2 }} />
      <Label size={10} color={accent} tracking={3}>{children}</Label>
    </div>
  );
}

// ─── GAUGE ───────────────────────────────────────────────────────
function Gauge({ value, max = 100, label, sublabel, color = C.purple, size = 110, unknown = false }) {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnim(unknown ? 0 : value), 300);
    return () => clearTimeout(t);
  }, [value, unknown]);

  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const arcFrac = 0.75;
  const arcLen = circ * arcFrac;
  const gap = circ * (1 - arcFrac);
  const fill = arcLen * (anim / max);
  const rotation = 135;

  const col = value >= 30 ? C.green : value >= 20 ? C.amber : unknown ? C.grey : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: `rotate(${rotation}deg)` }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${col}18`} strokeWidth={6}
            strokeDasharray={`${arcLen} ${gap}`} strokeLinecap="round" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={6}
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${col})` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          {unknown
            ? <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 22, color: C.grey }}>?</span>
            : <Value size={22} color={col}>{value}</Value>
          }
          <Label size={8} color={C.grey} tracking={1}>/100</Label>
        </div>
      </div>
      <Label size={10} color={C.greyL} tracking={1}>{label}</Label>
      {sublabel && <Label size={8} color={C.grey} tracking={0}>{sublabel}</Label>}
    </div>
  );
}

// ─── SCORE BAR ───────────────────────────────────────────────────
function ScoreBar({ label, value, max = 100, target, color = C.purple, unknown = false, note }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(unknown ? 0 : (value/max)*100), 200); return () => clearTimeout(t); }, [value, unknown, max]);
  const tPct = target ? (target/max)*100 : null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <div>
          <Label size={10} color={C.white} tracking={1}>{label}</Label>
          {note && <Label size={9} color={C.grey} tracking={0}> — {note}</Label>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          {target && <Label size={9} color={C.amber} tracking={0}>target {target}</Label>}
          <Value size={16} color={unknown ? C.grey : color}>{unknown ? "?" : value}</Value>
        </div>
      </div>
      <div style={{ height: 4, background: "#ffffff0A", borderRadius: 2, position: "relative" }}>
        <div style={{
          height: "100%", width: `${w}%`,
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          borderRadius: 2, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}55`
        }} />
        {tPct && <div style={{
          position: "absolute", top: -4, left: `${tPct}%`,
          width: 2, height: 12, background: C.amber, borderRadius: 1,
          boxShadow: `0 0 4px ${C.amber}`
        }} />}
      </div>
    </div>
  );
}

// ─── THRESHOLD PILL ──────────────────────────────────────────────
function ThreshPill({ score, label, unlocked, close }) {
  const c = unlocked ? C.green : close ? C.amber : C.red;
  const icon = unlocked ? "✓" : close ? "◈" : "○";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px",
      background: `${c}10`, border: `1px solid ${c}33`, borderRadius: 8,
      marginBottom: 6
    }}>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: c }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <Label size={10} color={C.white} tracking={1}>{score}</Label>
        <span style={{ marginLeft: 8 }} />
        <Label size={9} color={C.grey} tracking={0}>{label}</Label>
      </div>
      <Label size={8} color={c} tracking={2}>{unlocked ? "UNLOCKED" : close ? "CLOSE" : "LOCKED"}</Label>
    </div>
  );
}

// ─── HIDDEN METRIC ROW ───────────────────────────────────────────
function HiddenRow({ label, value, color = C.amber, tip }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", cursor: "help" }}
    >
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "9px 12px", borderRadius: 7, marginBottom: 4,
        background: hover ? "#ffffff06" : "transparent",
        border: `1px solid ${hover ? C.border : "transparent"}`,
        transition: "all 0.15s"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: C.grey }}>◈</span>
          <Label size={10} color={C.greyL} tracking={1}>{label}</Label>
        </div>
        <Label size={10} color={color} tracking={1}>{value}</Label>
      </div>
      {hover && tip && (
        <div style={{
          position: "absolute", bottom: "110%", left: 0, right: 0, zIndex: 99,
          background: C.bg3, border: `1px solid ${C.purple}55`,
          borderRadius: 8, padding: "10px 12px",
          fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: C.greyL, lineHeight: 1.7,
          boxShadow: `0 0 24px ${C.purple}44`, animation: "fadeUp 0.15s ease"
        }}>{tip}</div>
      )}
    </div>
  );
}

// ─── KPI ROW ─────────────────────────────────────────────────────
function KPIRow({ metric, current, target, unit = "", status, trend }) {
  const sc = status === "green" ? C.green : status === "red" ? C.red : C.amber;
  const sl = status === "green" ? "ON TRACK" : status === "red" ? "AT RISK" : "WATCH";
  const ti = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";
  const tc = trend === "up" ? C.green : trend === "down" ? C.red : C.grey;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto auto auto",
      gap: 12, alignItems: "center",
      padding: "10px 0", borderBottom: `1px solid ${C.border}55`
    }}>
      <Label size={10} color={C.white} tracking={1}>{metric}</Label>
      <Value size={16} color={C.cyan}>{current}{unit}</Value>
      <Label size={9} color={C.grey} tracking={0}>→ {target}{unit}</Label>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: tc }}>{ti}</span>
        <span style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
          color: sc, background: `${sc}15`, padding: "2px 7px", borderRadius: 3, letterSpacing: 1.5
        }}>{sl}</span>
      </div>
    </div>
  );
}

// ─── BRIEF ITEM ──────────────────────────────────────────────────
function BriefRow({ emoji, text, sub, urgency = "red" }) {
  const c = urgency === "red" ? C.red : urgency === "amber" ? C.amber : C.green;
  return (
    <div style={{
      display: "flex", gap: 10, padding: "10px 0",
      borderBottom: `1px solid ${C.border}44`
    }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
      <div>
        <Label size={10} color={C.white} tracking={1}>{text}</Label>
        {sub && <div style={{ marginTop: 3 }}><Label size={9} color={C.grey} tracking={0}>{sub}</Label></div>}
      </div>
    </div>
  );
}

// ─── LIVE DOT ────────────────────────────────────────────────────
function LiveDot() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: C.green, boxShadow: `0 0 8px ${C.green}`,
        animation: "pulse 2s ease-in-out infinite"
      }} />
      <Label size={9} color={C.green} tracking={2}>LIVE</Label>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────
export default function WHOiSEEDashboard() {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview",  label: "OVERVIEW"  },
    { id: "scores",    label: "PS SCORES" },
    { id: "hidden",    label: "HIDDEN METRICS" },
    { id: "kpis",      label: "KPIs"      },
    { id: "brief",     label: "BRIEF"     },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.white,
      fontFamily: "'Share Tech Mono', monospace",
      backgroundImage: `
        radial-gradient(ellipse 60% 40% at 15% 10%, ${C.purple}14 0%, transparent 60%),
        radial-gradient(ellipse 40% 30% at 85% 85%, ${C.cyan}08 0%, transparent 50%)
      `
    }}>
      <style>{FONT_INJECT}</style>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{
        padding: "18px 28px 0",
        borderBottom: `1px solid ${C.border}`,
        background: `linear-gradient(180deg, ${C.bg2} 0%, transparent 100%)`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 30, fontWeight: 700, letterSpacing: 2, color: C.purpleL
              }}>
                WHO<span style={{ color: C.cyan }}>i</span>SEE
              </span>
              <LiveDot />
            </div>
            <Label size={9} color={C.grey} tracking={2}>DSP + SOCIAL INTELLIGENCE · MARCH 2026 · TENx10</Label>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ marginBottom: 2 }}>
              <Label size={9} color={C.grey} tracking={1}>managed by </Label>
              <Label size={9} color={C.greyL} tracking={1}>Thomas Nalian</Label>
            </div>
            <div style={{
              padding: "4px 12px",
              background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 4
            }}>
              <Label size={9} color={C.red} tracking={2}>🚨 72-HR CRITICAL WINDOW ACTIVE</Label>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 0, marginTop: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 18px",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, letterSpacing: 2,
              color: tab === t.id ? C.cyan : C.grey,
              borderBottom: `2px solid ${tab === t.id ? C.cyan : "transparent"}`,
              transition: "all 0.18s"
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────── */}
      <div style={{ padding: "22px 28px", animation: "fadeUp 0.25s ease" }} key={tab}>

        {/* ══════ OVERVIEW TAB ══════ */}
        {tab === "overview" && (
          <div>
            {/* TOP ROW — 4 stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
              {[
                { label: "Monthly Listeners", val: "3–6K", sub: "target: 8–12K", color: C.purpleL },
                { label: "Artist Popularity Score", val: "15–25", sub: "target: 30+  •  check musicstax", color: C.cyan },
                { label: "Instagram Followers", val: "7,244", sub: "@whoisee.music  •  API not connected", color: C.green },
                { label: "PRESAVE LIVE", val: "Mar 4 TOMORROW", sub: "Get Down  •  T-1  •  bit.ly/xxGET-DOWNxx", color: C.red },
              ].map((s, i) => (
                <Card key={i} accent={s.color}>
                  <div style={{ marginBottom: 6 }}><Label size={9} color={C.grey} tracking={2}>{s.label}</Label></div>
                  <Value size={30} color={s.color}>{s.val}</Value>
                  <div style={{ marginTop: 5 }}><Label size={9} color={C.grey} tracking={0}>{s.sub}</Label></div>
                </Card>
              ))}
            </div>

            {/* MIDDLE ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {/* PLATFORM STATUS */}
              <Card accent={C.purple}>
                <SectionTitle accent={C.purpleL}>Platform Status</SectionTitle>
                {[
                  { p: "Spotify for Artists",       s: "✅ CONNECTED",      c: C.green, n: "Thomas has access" },
                  { p: "Instagram Graph API",        s: "❌ NOT CONNECTED",  c: C.red,   n: "Connect tonight — 3 minutes" },
                  { p: "Apple Music for Artists",    s: "❌ NOT REQUESTED",  c: C.red,   n: "Brett requests tonight" },
                  { p: "TikTok Business",            s: "❌ NOT SET UP",     c: C.red,   n: "Required for automation" },
                  { p: "Kannibalen Records",         s: "✅ DISTRIBUTED",    c: C.green, n: "Presave live: bit.ly/xxGET-DOWNxx" },
                  { p: "Discovery Mode — Get Down",  s: "❌ OFF — REQUEST",  c: C.red,   n: "DM Kannibalen — label controls S4A, not Thomas" },
                  { p: "Canvas — Get Down",          s: "❌ NOT UPLOADED",   c: C.red,   n: "Upload in S4A tonight" },
                  { p: "Asset Library (Drive)",      s: "⚠️ NOT CREATED",    c: C.amber, n: "Brett creates by March 7" },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: `1px solid ${C.border}55`
                  }}>
                    <div>
                      <Label size={10} color={C.white} tracking={1}>{r.p}</Label>
                      <div style={{ marginTop: 2 }}><Label size={9} color={C.grey} tracking={0}>{r.n}</Label></div>
                    </div>
                    <Label size={9} color={r.c} tracking={0}>{r.s}</Label>
                  </div>
                ))}
              </Card>

              {/* SHOWS + COLLAB */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Card accent={C.cyan}>
                  <SectionTitle accent={C.cyan}>Upcoming Shows</SectionTitle>
                  {[
                    { show: "Pittsburgh · SideQuest", date: "Mar 14", days: "11d", role: "Support DirtySnatcha · CONTRACT ✅", phase: "FINAL PUSH", c: C.red },
                    { show: "Asbury Park · House of Independents", date: "Apr 24", days: "52d", role: "Support DirtySnatcha · OFFER ⚠️", phase: "ANNOUNCEMENT", c: C.amber },
                  ].map((r, i) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}55` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <Label size={10} color={C.white} tracking={1}>{r.show}</Label>
                        <Label size={8} color={r.c} tracking={2}>{r.phase}</Label>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Label size={9} color={C.grey} tracking={0}>{r.role}</Label>
                        <Label size={10} color={r.c} tracking={1}>{r.days}</Label>
                      </div>
                    </div>
                  ))}
                </Card>

                <Card accent={C.amber} glow>
                  <SectionTitle accent={C.amber}>Collab Multiplier — Get Down</SectionTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <Label size={9} color={C.grey} tracking={1}>Hi I'm Ghost</Label>
                      <div style={{ marginTop: 4 }}><Value size={22} color={C.amber}>100.7K</Value></div>
                      <Label size={9} color={C.grey} tracking={0}>monthly listeners</Label>
                    </div>
                    <div>
                      <Label size={9} color={C.grey} tracking={1}>Label</Label>
                      <div style={{ marginTop: 4 }}><Value size={14} color={C.amber}>Kannibalen</Value></div>
                      <Label size={9} color={C.grey} tracking={0}>Records</Label>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: "8px 10px", background: `${C.amber}0F`, borderRadius: 6 }}>
                    <Label size={9} color={C.amber} tracking={1}>1% crossover = 1,007 saves. Enough to spike Track PS past 30 in week 1.</Label>
                  </div>
                </Card>
              </div>
            </div>

            {/* 72HR ALERT */}
            <Card accent={C.red} style={{ borderColor: `${C.red}66` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <Value size={14} color={C.red}>🚨 72-HOUR CRITICAL WINDOW — GET DOWN</Value>
                  <div style={{ marginTop: 6 }}>
                    <Label size={9} color={C.greyL} tracking={0}>What happens in the next 72 hrs sets the algorithm's opinion of this track permanently. Save rate, completion rate, and search volume are being measured RIGHT NOW.</Label>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginLeft: 20, flexShrink: 0 }}>
                  <Value size={44} color={C.red}>72</Value>
                  <div><Label size={8} color={C.grey} tracking={2}>HRS</Label></div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { a: "Toggle Discovery Mode ON in S4A", when: "NOW", who: "Thomas" },
                  { a: "Launch Meta Save Campaign $50–75", when: "TODAY", who: "Thomas" },
                  { a: "Request Apple Music for Artists", when: "TONIGHT", who: "Brett" },
                ].map((x, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: `${C.red}12`, border: `1px solid ${C.red}33`, borderRadius: 7 }}>
                    <Label size={10} color={C.white} tracking={0}>{x.a}</Label>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <Label size={9} color={C.red} tracking={1}>{x.when}</Label>
                      <Label size={9} color={C.grey} tracking={0}>{x.who}</Label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══════ PS SCORES TAB ══════ */}
        {tab === "scores" && (
          <div>
            {/* GAUGES ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
              <Card accent={C.purpleL}>
                <SectionTitle accent={C.purpleL}>Artist Popularity Score</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 8 }}>
                  <Gauge value={20} label="Artist PS" sublabel="est. 15–25 range" color={C.purpleL} size={120} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <ScoreBar label="Est. Min" value={15} target={30} color={C.purpleL} note="verify musicstax" />
                  <ScoreBar label="Est. Max" value={25} target={30} color={C.purple} />
                  <ScoreBar label="Q2 Target" value={40} color={C.cyan} note="6mo execution" />
                </div>
              </Card>

              <Card accent={C.cyan}>
                <SectionTitle accent={C.cyan}>Track PS — "Get Down"</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 8 }}>
                  <Gauge value={0} label="Track PS" sublabel="check musicstax NOW" color={C.cyan} size={120} unknown />
                </div>
                <div style={{ marginTop: 10, padding: "10px 12px", background: `${C.red}12`, border: `1px solid ${C.red}33`, borderRadius: 7, marginBottom: 12 }}>
                  <Label size={9} color={C.red} tracking={1}>Day 0 — Not yet checked</Label>
                  <div style={{ marginTop: 4 }}><Label size={9} color={C.grey} tracking={0}>metrics.musicstax.com → search "Get Down WHOiSEE"</Label></div>
                </div>
                <ScoreBar label="Release Radar threshold" value={0} target={20} color={C.red} note="refreshes Friday" unknown />
                <ScoreBar label="Discover Weekly threshold" value={0} target={30} color={C.amber} note="refreshes Monday" unknown />
              </Card>

              <Card accent={C.green}>
                <SectionTitle accent={C.green}>Shazam Count</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 8 }}>
                  <Gauge value={0} label="Shazams" sublabel="Pittsburgh campaign Mar 10–13" color={C.green} size={120} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <ScoreBar label="Current" value={0} target={50} color={C.green} note="baseline" />
                  <ScoreBar label="Pittsburgh Target (by Mar 14)" value={0} target={50} color={C.green} />
                </div>
                <div style={{ marginTop: 10, padding: "10px 12px", background: `${C.green}0C`, border: `1px solid ${C.green}33`, borderRadius: 7 }}>
                  <Label size={9} color={C.green} tracking={1}>Shazam spike = Apple Music editorial signal. 50+ in one market triggers "Trending" flag.</Label>
                </div>
              </Card>
            </div>

            {/* THRESHOLD MAP */}
            <Card accent={C.amber} style={{ marginBottom: 16 }}>
              <SectionTitle accent={C.amber}>Threshold Map — What Each Score Unlocks</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <ThreshPill score="Track 20+" label="Release Radar for non-followers. Refreshes Friday." unlocked={false} close={false} />
                  <ThreshPill score="Track 30+" label="Discover Weekly placement. Refreshes Monday." unlocked={false} close={false} />
                </div>
                <div>
                  <ThreshPill score="Artist 30+" label="~1,000 test listeners per new release." unlocked={false} close={true} />
                  <ThreshPill score="Artist 40+" label="~5,000 test listeners. Radio placement likely." unlocked={false} close={false} />
                </div>
              </div>
              <div style={{ marginTop: 10, padding: "10px 12px", background: `${C.amber}0C`, borderRadius: 7 }}>
                <Label size={9} color={C.amber} tracking={1}>Current est. Artist PS 15–25 → test group is ~100–500 listeners. Cross 30 = 10x multiplier on every future release.</Label>
              </div>
            </Card>

            {/* HOW SCORES MOVE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Card accent={C.purpleL}>
                <SectionTitle accent={C.purpleL}>What Moves Artist PS</SectionTitle>
                {[
                  { d: "Spotify search for 'WHOiSEE'", n: "#1 driver — use search CTA in every post, not link" },
                  { d: "Follower growth rate", n: "Organic follows > paid plays" },
                  { d: "Catalog save rate", n: "Saves across ALL tracks, not just new release" },
                  { d: "Release cadence", n: "No new ISRC in 6-8 weeks = score decays" },
                  { d: "Monthly listener trend", n: "Growth rate matters more than total number" },
                ].map((x, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}44` }}>
                    <Label size={10} color={C.white} tracking={0}>{x.d}</Label>
                    <div><Label size={9} color={C.grey} tracking={0}>{x.n}</Label></div>
                  </div>
                ))}
              </Card>

              <Card accent={C.cyan}>
                <SectionTitle accent={C.cyan}>What Moves Track PS</SectionTitle>
                {[
                  { d: "Saves (library adds)", n: "Strongest signal — 3–5x weight vs stream" },
                  { d: "Completion rate", n: "% who play to end. First 15 sec must hook." },
                  { d: "Skip rate", n: "Skip before 30s = actively harms score" },
                  { d: "User playlist adds", n: "When listener adds to personal playlist" },
                  { d: "Concentrated timing", n: "500 saves in 3 days > 500 saves over 3 months" },
                  { d: "Shazam activity", n: "Feeds Spotify + Apple Music algorithm both" },
                ].map((x, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}44` }}>
                    <Label size={10} color={C.white} tracking={0}>{x.d}</Label>
                    <div><Label size={9} color={C.grey} tracking={0}>{x.n}</Label></div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {/* ══════ HIDDEN METRICS TAB ══════ */}
        {tab === "hidden" && (
          <div>
            <div style={{ marginBottom: 14, padding: "10px 14px", background: `${C.purple}10`, border: `1px solid ${C.purple}33`, borderRadius: 8 }}>
              <Label size={9} color={C.purpleL} tracking={1}>These signals are invisible in Spotify for Artists but are the actual inputs the algorithm uses to score your track. Hover each metric for context.</Label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* SPOTIFY SIGNALS */}
              <Card accent={C.purpleL}>
                <SectionTitle accent={C.purpleL}>Spotify Algorithm Signals</SectionTitle>
                <HiddenRow label="Save-to-Stream Ratio" value="⚠ UNKNOWN" color={C.red}
                  tip="Target: >10%. This is the single most important number this week. Below 5% = wrong audience (your ads are reaching the wrong people). Check S4A Analytics → Get Down → Streams vs Saves tab. Should be live ~24hrs after release." />
                <HiddenRow label="Track Completion Rate" value="⚠ UNKNOWN" color={C.red}
                  tip="% of listeners who finish the track. High completion = algorithm treats it as high quality. Canvas loops reduce skip rate by 8–12%. Upload Canvas in S4A tonight — it directly improves this signal." />
                <HiddenRow label="Skip Rate (pre-30s)" value="⚠ UNKNOWN" color={C.red}
                  tip="Skips before 30 seconds are actively harmful and permanently lower Track PS. The dubstep drop needs to hit hard before 15 seconds. If skip rate is high, this is a creative problem, not a promo problem." />
                <HiddenRow label="User Playlist Adds" value="⚠ UNKNOWN" color={C.amber}
                  tip="When a listener adds Get Down to their OWN playlist (not just saves to library), it signals deep engagement. CTA in posts: 'add Get Down to your playlist' not just 'stream it'." />
                <HiddenRow label="Repeat Listen Rate" value="⚠ UNKNOWN" color={C.amber}
                  tip="Same listener coming back = strong quality signal. If your drop is hard enough, they'll replay it. Visible indirectly in S4A under listener activity but no direct metric shown." />
                <HiddenRow label="Discovery Mode Status" value="❌ OFF — TURN ON" color={C.red}
                  tip="Discovery Mode trades ~30% royalty reduction for 2–3x algorithmic impressions in Radio and Autoplay. Get Down is on Kannibalen Records — Thomas does NOT have S4A access for this track. Brett or Thomas needs to DM Kannibalen directly to request Discovery Mode toggle. This is the single most impactful free action available — but requires Kannibalen cooperation." />
                <HiddenRow label="Canvas Uploaded" value="❌ NOT UPLOADED" color={C.red}
                  tip="3–8 second looping video. Tracks WITH Canvas get 145% more shares on Spotify. Reduces skip rate. Increases save rate. Upload in S4A tonight. Use any visual loop — abstract visuals work fine. Takes 5 minutes." />
                <HiddenRow label="Audio Message (Spotify)" value="❌ NOT RECORDED" color={C.amber}
                  tip="30-second voice message from Brett to followers. Appears as a Spotify notification. Drives first-day saves significantly. S4A → Profile → Audio Message. Record tonight." />
              </Card>

              {/* CROSS-PLATFORM SIGNALS */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Card accent={C.green}>
                  <SectionTitle accent={C.green}>Apple Music / Shazam Signals</SectionTitle>
                  <HiddenRow label="Shazam Count — Get Down" value="0 (baseline)" color={C.amber}
                    tip="Shazam is Apple Music's #1 external algorithm signal. Regional Shazam spike triggers 'Trending on Shazam' which feeds Apple Music editorial algorithm. Pittsburgh Shazam Spike campaign (March 10–13) targets 50+ Shazams in a single market." />
                  <HiddenRow label="Apple Music Algorithmic Playlist" value="⚠ NOT CONFIRMED" color={C.amber}
                    tip="Apple Music has their own 'New Music Daily', 'Future Hits', and genre-specific algorithmic playlists. Access is driven by: Apple Music for Artists profile (Brett needs to request tonight), Shazam data, and Apple editorial pitches." />
                  <HiddenRow label="Apple Music for Artists Access" value="❌ NOT REQUESTED" color={C.red}
                    tip="Brett requests at artists.apple.com. This gives access to Apple Music analytics AND unlocks Shazam for Artists data so you can see Shazam counts by market. Required before Pittsburgh Shazam Spike campaign makes sense." />
                  <HiddenRow label="Algorithmic Test Group Size" value="~100–500" color={C.amber}
                    tip="Based on estimated Artist PS 15–25. This is how many people Spotify initially tests Get Down with on release day. Cross Artist PS 30 = jumps to ~1,000. Cross Artist PS 40 = jumps to ~5,000. Every save, search CTA, and repeat listen pushes this number up." />
                </Card>

                <Card accent={C.cyan}>
                  <SectionTitle accent={C.cyan}>Social + External Signals</SectionTitle>
                  <HiddenRow label="Spotify Search Volume (name)" value="⚠ UNKNOWN" color={C.amber}
                    tip="Manual searches for 'WHOiSEE' in Spotify directly boost Artist PS. This is why every post should say 'Search WHOiSEE on Spotify' not 'click the link in bio'. Link clicks bypass this signal entirely. Search is the #1 Artist PS driver." />
                  <HiddenRow label="TikTok Sound Usage" value="⚠ NOT TRACKING" color={C.amber}
                    tip="When people use Get Down as a TikTok sound, it feeds back into Spotify's trending data. Create TikTok content using the audio WITHOUT showing the track name — force Shazam behavior. This creates a loop: Shazam → Apple algorithm → Spotify algorithm." />
                  <HiddenRow label="Bandsintown Event Data" value="⚠ CHECK STATUS" color={C.amber}
                    tip="Bandsintown syncs with Spotify and Apple Music to show upcoming shows to fans. Pittsburgh March 14 and Asbury Park April 24 should be listed. Thomas: verify shows are on Bandsintown — missing event data = missed Spotify widget impressions." />
                  <HiddenRow label="Geographic Listen Concentration" value="⚠ UNKNOWN" color={C.grey}
                    tip="Streams concentrated in Pittsburgh, NJ/NYC, and Tucson markets are more algorithmically valuable than random global streams. Ad targeting to tour markets serves double purpose: sells tickets AND builds market-specific algorithmic authority." />

                  <div style={{ marginTop: 12, padding: "10px 12px", background: `${C.cyan}0A`, borderRadius: 7, border: `1px solid ${C.cyan}22` }}>
                    <Label size={9} color={C.cyan} tracking={1}>Check Popularity Scores daily at:</Label>
                    <div style={{ marginTop: 4 }}>
                      {["metrics.musicstax.com (free)", "submithub.com/popularity-checker (free)", "artist.tools (freemium)"].map((u, i) => (
                        <div key={i} style={{ padding: "3px 0" }}><Label size={9} color={C.greyL} tracking={0}>◈ {u}</Label></div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ══════ KPIs TAB ══════ */}
        {tab === "kpis" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <Card accent={C.cyan}>
                <SectionTitle accent={C.cyan}>30-Day KPI Targets — March 2026</SectionTitle>
                <KPIRow metric="Spotify Monthly Listeners" current="3–6K" target="8–12K" trend="up" status="watch" />
                <KPIRow metric="Artist Popularity Score" current="15–25" target="30+" trend="neutral" status="watch" />
                <KPIRow metric="Track PS — Get Down" current="?" target="25–35" trend="neutral" status="red" />
                <KPIRow metric="Shazam Count (Pittsburgh)" current="0" target="50+" trend="neutral" status="red" />
                <KPIRow metric="Instagram Followers" current="7,244" target="8,500+" trend="neutral" status="watch" />
                <KPIRow metric="Instagram Engagement Rate" current="?" target="3–5%" trend="neutral" status="red" />
                <KPIRow metric="Save-to-Stream Ratio" current="?" target="10%+" trend="neutral" status="red" />
                <KPIRow metric="Next Release Locked" current="TBD" target="Apr 15" trend="neutral" status="watch" />
                <KPIRow metric="Release Cadence (6-wk rule)" current="Mar 4" target="Apr 15" trend="up" status="green" />
              </Card>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Card accent={C.green}>
                  <SectionTitle accent={C.green}>Action Stack — Priority Order</SectionTitle>
                  {[
                    { n: 1, text: "Check Track PS on Musicstax", when: "NOW", who: "Thomas", c: C.red },
                    { n: 2, text: "Toggle Discovery Mode ON in S4A", when: "TONIGHT", who: "Thomas", c: C.red },
                    { n: 3, text: "DM Kannibalen Records — request Discovery Mode for Get Down", when: "TODAY", who: "Thomas/Brett", c: C.red },
                    { n: 4, text: "Launch Meta Save Campaign $50–75", when: "TODAY", who: "Thomas", c: C.red },
                    { n: 5, text: "Request Apple Music for Artists", when: "TONIGHT", who: "Brett", c: C.red },
                    { n: 6, text: "Lock next single (Apr 10 target)", when: "Mar 6", who: "Thomas+Lee", c: C.amber },
                    { n: 7, text: "Check Track PS daily Mar 4–10", when: "Daily", who: "Thomas", c: C.amber },
                    { n: 8, text: "Launch Pittsburgh Shazam Spike $50–75", when: "Mar 10", who: "Thomas", c: C.amber },
                    { n: 9, text: "Create WHOiSEE Asset Library (Drive)", when: "Mar 7", who: "Brett+T", c: C.grey },
                  ].map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}44`, alignItems: "flex-start" }}>
                      <Value size={16} color={a.c}>{a.n}</Value>
                      <div style={{ flex: 1 }}>
                        <Label size={10} color={C.white} tracking={0}>{a.text}</Label>
                        <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                          <Label size={9} color={a.c} tracking={1}>{a.when}</Label>
                          <Label size={9} color={C.grey} tracking={0}>{a.who}</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>

                <Card accent={C.amber}>
                  <SectionTitle accent={C.amber}>Ad Budget Plan</SectionTitle>
                  {[
                    { item: "Meta Save Campaign — Get Down", b: "$50–75", when: "Mar 4 LAUNCH", s: "READY TOMORROW", c: C.red },
                    { item: "Pittsburgh Shazam Spike", b: "$50–75", when: "Mar 10–13", s: "SCHEDULE", c: C.amber },
                    { item: "Tucson/MAD 2026 Shazam Spike", b: "$50–75", when: "TBD", s: "PENDING DATE", c: C.grey },
                    { item: "Asbury Park Shazam Spike", b: "$50–75", when: "Apr 17–23", s: "PLAN AHEAD", c: C.grey },
                  ].map((r, i) => (
                    <div key={i} style={{ padding: "9px 0", borderBottom: `1px solid ${C.border}44` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <Label size={10} color={C.white} tracking={0}>{r.item}</Label>
                        <Value size={16} color={C.cyan}>{r.b}</Value>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Label size={9} color={C.grey} tracking={0}>{r.when}</Label>
                        <Label size={8} color={r.c} tracking={2}>{r.s}</Label>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", padding: "10px 12px", background: `${C.cyan}0A`, borderRadius: 7 }}>
                    <Label size={10} color={C.white} tracking={1}>Total Estimated</Label>
                    <Value size={22} color={C.cyan}>$200–300</Value>
                  </div>
                </Card>
              </div>
            </div>

            {/* 6-WEEK CADENCE */}
            <Card accent={C.purple}>
              <SectionTitle accent={C.purpleL}>6-Week Release Cadence — Artist PS Decay Rule</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 10 }}>
                {[
                  { w: "W1", d: "Mar 4", done: false, label: "GET DOWN — PRESAVE LIVE" },
                  { w: "W2", d: "Mar 11", done: false },
                  { w: "W3", d: "Mar 18", done: false },
                  { w: "W4", d: "Mar 25", done: false },
                  { w: "W5", d: "Apr 1",  done: false },
                  { w: "W6", d: "Apr 8",  done: false, deadline: true },
                ].map((x, i) => (
                  <div key={i} style={{
                    padding: "10px 8px", borderRadius: 8, textAlign: "center",
                    background: x.done ? `${C.green}18` : x.deadline ? `${C.red}14` : `${C.purple}0C`,
                    border: `1px solid ${x.done ? C.green : x.deadline ? C.red : C.border}44`
                  }}>
                    <Label size={9} color={x.done ? C.green : x.deadline ? C.red : C.grey} tracking={1}>{x.w}</Label>
                    <div style={{ marginTop: 3 }}><Label size={8} color={C.grey} tracking={0}>{x.d}</Label></div>
                    {x.done && <div style={{ marginTop: 4 }}><Label size={8} color={C.green} tracking={0}>✓ LIVE</Label></div>}
                    {x.deadline && <div style={{ marginTop: 4 }}><Label size={8} color={C.red} tracking={1}>DEADLINE</Label></div>}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Label size={9} color={C.grey} tracking={0}>Get Down live: <span style={{ color: C.green }}>Mar 4</span></Label>
                <Label size={9} color={C.grey} tracking={0}>Next ISRC deadline: <span style={{ color: C.red }}>Apr 15</span></Label>
                <Label size={9} color={C.grey} tracking={0}>Lock next single by: <span style={{ color: C.amber }}>Mar 6</span></Label>
                <Label size={9} color={C.grey} tracking={0}>Upload to VMG by: <span style={{ color: C.amber }}>Mar 10</span></Label>
              </div>
            </Card>
          </div>
        )}

        {/* ══════ BRIEF TAB ══════ */}
        {tab === "brief" && (
          <div>
            {/* HEADER LINE */}
            <div style={{ marginBottom: 16, padding: "10px 16px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <Label size={10} color={C.greyL} tracking={1}>Good morning, Thomas. Here's what matters today. — March 4, 2026</Label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* URGENT */}
                <Card accent={C.red}>
                  <SectionTitle accent={C.red}>🔴 Urgent — Do Today</SectionTitle>
                  <BriefRow emoji="🔴" urgency="red"
                    text="Check Get Down Track PS on Musicstax RIGHT NOW"
                    sub="metrics.musicstax.com — search 'Get Down WHOiSEE'. Text number to Brett. This changes your spend decision for the next 72 hours." />
                  <BriefRow emoji="🔴" urgency="red"
                    text="Toggle Discovery Mode ON in Spotify for Artists before midnight"
                    text="DM Kannibalen to request Discovery Mode for Get Down"
                    sub="Get Down is on Kannibalen Records — Thomas has NO S4A access for this track. DM them: 'Can you enable Discovery Mode for Get Down? Worth 2–3x algorithmic impressions.' This is the single most impactful free action." />
                  <BriefRow emoji="🔴" urgency="red"
                    text="Launch Meta Save Campaign $50–75 targeting bass fans"
                    sub="Target: Pittsburgh, Tucson, NJ markets. Bass/dubstep/riddim fans 25–34. CTA: 'Add to library' not 'listen now'. Save-to-stream ratio is the #1 algorithm signal." />
                  <BriefRow emoji="🔴" urgency="red"
                    text="Brett requests Apple Music for Artists at artists.apple.com"
                    sub="5 minutes. Unlocks Shazam for Artists data. Required before Pittsburgh Shazam Spike campaign (Mar 10–13) makes strategic sense." />
                  <BriefRow emoji="🔴" urgency="red"
                    text="Upload Canvas to Get Down in S4A"
                    sub="Any 3–8 second loop visual. Tracks with Canvas = 145% more shares. Directly reduces skip rate. Do it tonight alongside Discovery Mode toggle." />
                </Card>

                {/* THIS WEEK */}
                <Card accent={C.amber}>
                  <SectionTitle accent={C.amber}>🟡 This Week</SectionTitle>
                  <BriefRow emoji="🟡" urgency="amber"
                    text="Lock next single by March 6 — April 10 target drop"
                    sub="6-week rule: no new ISRC after April 15 = Artist PS decay. Upload to VMG by March 10 to ensure distribution by April 10. Thomas + Lee: what's next?" />
                  <BriefRow emoji="🟡" urgency="amber"
                    text="Check Track PS on Musicstax daily March 4–10"
                    sub="If PS approaching 20 by Thursday → max spend before Friday Release Radar refresh. If approaching 30 by weekend → push before Monday Discover Weekly. These timing windows are everything." />
                  <BriefRow emoji="🟡" urgency="amber"
                    text="Schedule Pittsburgh Shazam Spike — launch March 10"
                    sub="$50–75 · Pittsburgh 15-mile radius · 'WHAT TRACK IS THIS? 🛸' NO track name shown · ThruPlay video objective · 50+ Shazams goal · feeds Apple Music algorithm" />
                  <BriefRow emoji="🟡" urgency="amber"
                    text="Connect Instagram Graph API"
                    sub="Without API: no engagement data, no scheduled posting, no automation. Brett: 3 minutes in platform settings. This is the highest-leverage platform connection available." />
                </Card>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* CONTENT TODAY */}
                <Card accent={C.cyan}>
                  <SectionTitle accent={C.cyan}>📱 Content Today — March 4</SectionTitle>
                  {[
                    {
                      platform: "IG / FB / X",
                      type: "ANNOUNCEMENT",
                      priority: "HIGH",
                      copy: "GET DOWN 🛸 WHOiSEE x @hiimghostsound — out now on @kannibalen_records go run it up — link in bio 🔗"
                    },
                    {
                      platform: "IG Stories",
                      type: "SEARCH CTA",
                      priority: "HIGH",
                      copy: "Search 'WHOiSEE' on Spotify 🛸 Get Down is out right now — go find it"
                    },
                    {
                      platform: "TikTok",
                      type: "AUDIO FIRST — NO TITLE",
                      priority: "HIGH",
                      copy: "First 15 seconds — hardest drop. NO track name in video. Force Shazam behavior. Caption: 'WHAT IS THIS TRACK 🛸👽 shazam it'"
                    },
                  ].map((c, i) => (
                    <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}44` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ padding: "2px 8px", background: `${C.cyan}18`, border: `1px solid ${C.cyan}33`, borderRadius: 4 }}>
                            <Label size={8} color={C.cyan} tracking={1}>{c.platform}</Label>
                          </span>
                          <Label size={8} color={C.grey} tracking={1}>{c.type}</Label>
                        </div>
                        <Label size={8} color={C.red} tracking={2}>{c.priority}</Label>
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: C.greyL, lineHeight: 1.7, fontStyle: "italic" }}>"{c.copy}"</div>
                    </div>
                  ))}
                </Card>

                {/* METRICS CHECK */}
                <Card accent={C.green}>
                  <SectionTitle accent={C.green}>📊 Metrics Check</SectionTitle>
                  {[
                    { label: "Spotify Monthly Listeners", val: "~3–6K", note: "Verify in S4A" },
                    { label: "Artist Popularity Score", val: "15–25 est.", note: "Target: 30+ · musicstax" },
                    { label: "Track PS — Get Down", val: "CHECK NOW", note: "metrics.musicstax.com" },
                    { label: "Shazam Count", val: "0 (baseline)", note: "Pittsburgh spike Mar 10" },
                    { label: "Instagram Followers", val: "7,244", note: "@whoisee.music · no API yet" },
                    { label: "Hi I'm Ghost ML", val: "100.7K", note: "Collab reach multiplier" },
                    { label: "Kannibalen Label", val: "DISTRIBUTED", note: "Get Down live Mar 4" },
                    { label: "Next Release Deadline", val: "Apr 15", note: "6-week Artist PS rule" },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}44` }}>
                      <div>
                        <Label size={10} color={C.white} tracking={0}>{m.label}</Label>
                        <div><Label size={9} color={C.grey} tracking={0}>{m.note}</Label></div>
                      </div>
                      <Value size={14} color={m.val === "CHECK NOW" ? C.red : C.cyan}>{m.val}</Value>
                    </div>
                  ))}
                </Card>

                {/* RECOMMENDATION */}
                <Card accent={C.purpleL} glow>
                  <SectionTitle accent={C.purpleL}>💡 Strategic Recommendation</SectionTitle>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: C.greyL, lineHeight: 1.8, marginBottom: 12 }}>
                    <span style={{ color: C.cyan }}>The Hi I'm Ghost collab is the biggest release moment WHOiSEE has had.</span> 100.7K monthly listeners on Kannibalen Records — if 1% of their audience saves Get Down, that's 1,000 saves in week 1. That alone pushes Track PS past 30 and Artist PS past 30 simultaneously.
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: C.greyL, lineHeight: 1.8, marginBottom: 12 }}>
                    The Facebook presave post has <span style={{ color: C.red }}>4 likes, 2 comments, 3 shares</span> — 1 day pre-release. Presave link confirmed live: <span style={{ color: C.cyan }}>bit.ly/xxGET-DOWNxx</span>. Organic isn't moving on its own. The $50–75 save campaign launching tomorrow and the Discovery Mode DM to Kannibalen are the difference between this track dying in the algorithm and compounding for 4 weeks.
                  </div>
                  <div style={{ padding: "12px 14px", background: `${C.purple}18`, borderRadius: 8, border: `1px solid ${C.purple}55` }}>
                    <Label size={9} color={C.purpleL} tracking={2}>CTA</Label>
                    <div style={{ marginTop: 6, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: C.white, lineHeight: 1.8 }}>
                      DM Kannibalen Records TODAY to request Discovery Mode for Get Down — they own the S4A access on this track, Thomas cannot toggle it directly. Then check Track PS on Musicstax after midnight tonight (release goes live Mar 4). Text the number to Brett. <span style={{ color: C.amber }}>PS determines how hard you push the $50–75 save campaign in the next 72 hours.</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${C.border}55`, display: "flex", justifyContent: "space-between" }}>
          <Label size={8} color={C.grey} tracking={2}>TENx10 · WHOiSEE INTELLIGENCE · MARCH 2026</Label>
          <Label size={8} color={C.grey} tracking={1}>thomas@dirtysnatcha.com · 248-765-1997</Label>
        </div>
      </div>
    </div>
  );
}
