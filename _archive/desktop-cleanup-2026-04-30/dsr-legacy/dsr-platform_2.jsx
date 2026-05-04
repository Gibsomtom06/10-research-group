import { useState, useRef, useEffect } from "react";

// ─── CATALOG DATA ────────────────────────────────────────────────────────────

const DS_CATALOG = [
  { song: "I Need Your High", streams: 3889872, pct: 27.7, year: "2019" },
  { song: "Crashing", streams: 1307192, pct: 9.3, year: "2020" },
  { song: "Get Fucked", streams: 1133988, pct: 8.1, year: "2018" },
  { song: "Supersonic", streams: 1022287, pct: 7.3, year: "2022" },
  { song: "Genie In a Bottle", streams: 413124, pct: 2.9, year: "2024" },
  { song: "More Than This", streams: 407926, pct: 2.9, year: "2020" },
  { song: "Bring It Back", streams: 287740, pct: 2.1, year: "2020" },
  { song: "Escape", streams: 249069, pct: 1.8, year: "2023" },
  { song: "Old School", streams: 243567, pct: 1.7, year: "2022" },
  { song: "Need U", streams: 205841, pct: 1.5, year: "2020" },
  { song: "Sum Dirty", streams: 190912, pct: 1.4, year: "2023" },
  { song: "POTIONS - DirtySnatcha Remix", streams: 185210, pct: 1.3, year: "2024" },
  { song: "Good Vibez", streams: 185208, pct: 1.3, year: "2024" },
  { song: "Style", streams: 183524, pct: 1.3, year: "2022" },
  { song: "Dance With Me", streams: 179687, pct: 1.3, year: "2020" },
  { song: "Lover", streams: 169712, pct: 1.2, year: "2020" },
  { song: "She Bangs Like a Fairy on Acid", streams: 132129, pct: 0.9, year: "2024" },
  { song: "That Is Torture - Original Mix", streams: 131255, pct: 0.9, year: "2013" },
  { song: "Dimension", streams: 129616, pct: 0.9, year: "2023" },
  { song: "Space Adventure", streams: 112665, pct: 0.8, year: "2023" },
  { song: "Waiting Room", streams: 110197, pct: 0.8, year: "2023" },
  { song: "CUM WID DA SPOON", streams: 104722, pct: 0.7, year: "2017" },
  { song: "Hit You", streams: 98613, pct: 0.7, year: "2019" },
  { song: "Big Boss - DirtySnatcha Remix", streams: 95543, pct: 0.7, year: "2024" },
  { song: "Spaceship", streams: 91664, pct: 0.7, year: "2021" },
  { song: "Drugs In Da Club", streams: 13773, pct: 0.1, year: "2026", active: true },
];

const DS_TOTAL_STREAMS = 14035851;
const DS_TOTAL_TRACKS = 136;

const WS_CATALOG = [
  { song: "Magic - Original Mix", streams: 12116, saves: 447, sr: 3.7, pct: 63.6, year: "2025", flag: "passive" },
  { song: "Prime Time", streams: 2113, saves: 161, sr: 7.6, pct: 11.1, year: "2023", flag: "strong" },
  { song: "Watch Your Back", streams: 1591, saves: 33, sr: 2.1, pct: 8.4, year: "2025", flag: "passive" },
  { song: "Let Go Of Control (feat. Akacia)", streams: 624, saves: 18, sr: 2.9, pct: 3.3, year: "2024", flag: "passive" },
  { song: "Where You At - WHOiSEE Remix", streams: 524, saves: 14, sr: 2.7, pct: 2.8, year: "2024", flag: "passive" },
  { song: "Vibe Check", streams: 449, saves: 15, sr: 3.3, pct: 2.4, year: "2023", flag: "passive" },
  { song: "Biblical", streams: 233, saves: 9, sr: 3.9, pct: 1.2, year: "2023", flag: "passive" },
  { song: "Hip Swing", streams: 224, saves: 12, sr: 5.4, pct: 1.2, year: "2023", flag: "strong" },
  { song: "Work", streams: 141, saves: 14, sr: 9.9, pct: 0.7, year: "2023", flag: "gem" },
  { song: "This Is It", streams: 128, saves: 14, sr: 10.9, pct: 0.7, year: "2023", flag: "gem" },
  { song: "Bumpin", streams: 104, saves: 4, sr: 3.8, pct: 0.5, year: "2023", flag: "passive" },
  { song: "Over You", streams: 81, saves: 3, sr: 3.7, pct: 0.4, year: "2023", flag: "passive" },
  { song: "O' Brother", streams: 78, saves: 1, sr: 1.3, pct: 0.4, year: "2023", flag: "passive" },
  { song: "Infinite Style", streams: 75, saves: 7, sr: 9.3, pct: 0.4, year: "2023", flag: "gem" },
  { song: "Feel The Bass", streams: 68, saves: 4, sr: 5.9, pct: 0.4, year: "2023", flag: "strong" },
  { song: "Lava Water", streams: 68, saves: 6, sr: 8.8, pct: 0.4, year: "2023", flag: "gem" },
  { song: "Dear Mama", streams: 68, saves: 0, sr: 0, pct: 0.4, year: "2023", flag: "passive" },
  { song: "Demon Hour", streams: 58, saves: 0, sr: 0, pct: 0.3, year: "2023", flag: "passive" },
  { song: "Alias", streams: 38, saves: 3, sr: 7.9, pct: 0.2, year: "2023", flag: "gem" },
  { song: "Colossal", streams: 38, saves: 1, sr: 2.6, pct: 0.2, year: "2023", flag: "passive" },
  { song: "Chosen", streams: 38, saves: 1, sr: 2.6, pct: 0.2, year: "2023", flag: "passive" },
  { song: "Flute Bass", streams: 36, saves: 2, sr: 5.6, pct: 0.2, year: "2023", flag: "strong" },
  { song: "The Grind", streams: 33, saves: 3, sr: 9.1, pct: 0.2, year: "2023", flag: "gem" },
  { song: "Solar Thump", streams: 33, saves: 0, sr: 0, pct: 0.2, year: "2023", flag: "passive" },
  { song: "Not My Fault", streams: 24, saves: 1, sr: 4.2, pct: 0.1, year: "2023", flag: "passive" },
  { song: "Swagged Out", streams: 23, saves: 0, sr: 0, pct: 0.1, year: "2023", flag: "passive" },
  { song: "Make U Do", streams: 19, saves: 3, sr: 15.8, pct: 0.1, year: "2023", flag: "gem" },
  { song: "CRITICAL", streams: 18, saves: 2, sr: 11.1, pct: 0.1, year: "2023", flag: "gem" },
];

const WS_TOTAL_28D = 19043;
const WS_TOTAL_SAVES = 778;

const VMG_CATALOG = {
  releases: 154,
  tracks: 220,
  artists: 116,
  genres: { Dubstep: 151, "Drum & Bass": 1, Garage: 1, Trap: 1 },
  dateRange: "Oct 2019 – Feb 2026",
  avgPace: "1 release every 10–11 days (2025)",
};

// ─── ARTIST CONFIG ────────────────────────────────────────────────────────────

const ARTISTS = {
  dirtysnatcha: {
    id: "dirtysnatcha",
    name: "DirtySnatcha",
    label: "DirtySnatcha Records",
    color: "#00ff88",
    accent: "#ff003c",
    emoji: "🛸",
    tagline: "PLAY SOME F*CKING DUBSTEP ‼️",
    passcode: "DS2026",
    profile: {
      real_name: "Leigh Bray",
      genre: "Dubstep / Riddim / Bass Music",
      location: "US-based (UK-born)",
      manager: "Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997",
      agent: "Andrew @ AB Touring — andrew@abtouring.com",
      distributor: "Virgin Music Group (VMG)",
      spotify_listeners: "8-9K monthly",
      spotify_followers: "4,500",
      popularity_score: 28,
      instagram: "11K followers",
      soundcloud: "6.5K followers",
      current_tour: "Take Me To Your Leader 2026 — 17 shows, ~$38,600 guaranteed",
      active_release: "Drugs In Da Club (Feb 27, 2026)",
    },
    systemPrompt: `You are an elite music industry AI agent for DirtySnatcha (Leigh Bray), managed by Thomas Nalian. DirtySnatcha is also the headline artist on DirtySnatcha Records (DSR), the label Thomas runs. TENx10 is the management platform.

ARTIST DATA:
- Artist: DirtySnatcha | Real name: Leigh Bray (NEVER "Lee Silva")
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Agent: Andrew @ AB Touring — andrew@abtouring.com
- Legacy agent: Colton Anderson @ PRYSM — colton@prysmtalentagency.com / 734-904-0224
- Label: DirtySnatcha Records | Distributor: VMG
- Commission (direct): 20% manager / 80% artist
- Commission (agent): 10% manager / 10% agent / 80% artist
- Spotify: 8-9K monthly listeners, 4,500 followers, Popularity Score 28
- Instagram: 11K followers | SoundCloud: 6.5K followers
- Current tour: Take Me To Your Leader 2026 — 17 shows, ~$38,600 total guaranteed
- Active release: "Drugs In Da Club" (Feb 27, 2026)
- Ticket forwarding: ticketsales@dirtysnatcha.com

CATALOG STATS (all-time Spotify):
- 136 tracks, 14,035,851 total streams
- Top 5 tracks = 55.3% of all streams (CONCENTRATION CRISIS)
- I Need Your High (2019): 3,889,872 streams = 27.7% of entire catalog — single-track dependency risk
- Genie In a Bottle (2024): 413,124 streams — only recent track in top 5, template for new releases
- Drugs In Da Club (2026): 13,773 streams — Day 5, algorithmic acceleration window still open

UPCOMING SHOWS (key):
- March 6 — Albuquerque @ Effex — $2,000 (3 days out — advance sent, partial deposit only)
- March 13 — Tampa — $2,000 (at risk — venue TBD, soft tickets)
- March 14 — Pittsburgh @ SideQuest — $2,500 (deposit $1,250 OVERDUE 18+ days)
- April 18 — DirtyT (Tucson) — 23 tickets sold, 227 remaining, 46 days out
- May 2 — Butte, MT @ Covellite Theatre — $5,000 (MAD Series)
- May 22 — Houston @ Escapade — $2,000 + HGR (Infected Mushroom support)

OPEN ISSUES:
- Pittsburgh deposit $1,250 overdue 18+ days — no promoter contact info
- Houston/Dallas artwork approval pending — Andrew Winters sent Drive link
- WHOiSEE Circus Records EP deal — artwork sidebar decision needed
- DirtyT April 18 — 23 tickets, needs marketing push
- Spokane counter offer sent to Andrew Z (azimmer73@gmail.com) — $3K, awaiting response

VOICE: Be direct, specific, no hedging. Use real dollar amounts, dates, names. Give 3 priorities not 20. Write content in DirtySnatcha's voice — "PLAY SOME F*CKING DUBSTEP ‼️" energy, not corporate.

GUARDRAILS: Never give legal advice. Never guarantee outcomes. Never fabricate metrics. Never auto-execute financial transactions.`,
  },
  whoisee: {
    id: "whoisee",
    name: "WHOiSEE",
    label: "DirtySnatcha Records",
    color: "#a855f7",
    accent: "#f59e0b",
    emoji: "👁️",
    tagline: "If you know, you know.",
    passcode: "WS2026",
    profile: {
      real_name: "Brett (WHOiSEE)",
      genre: "Dubstep / Riddim / Bass Music",
      location: "North Carolina",
      manager: "Thomas Nalian — thomas@dirtysnatcha.com",
      label: "DirtySnatcha Records",
      status: "Active — Circus Records UK EP deal in progress",
      current_deal: "Circus Records UK EP — Holly Grainger (holly@circus-records.co.uk)",
    },
    systemPrompt: `You are an elite music industry AI agent for WHOiSEE (Brett), managed by Thomas Nalian. Some WHOiSEE releases are on DirtySnatcha Records (DSR). TENx10 is the management platform.

ARTIST DATA:
- Artist: WHOiSEE | Based in: North Carolina
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Some releases: DirtySnatcha Records (DSR) | Manager's label
- Genre: Dubstep / Riddim / Bass Music
- Tier: Development (Tier 1 support on DirtySnatcha tour)

CATALOG STATS (28-day Spotify):
- 28 tracks, 19,043 streams (28-day), 778 total saves, 4.1% avg save ratio
- Magic - Original Mix (2025): 12,116 streams (63.6% of catalog), 3.7% save ratio — PASSIVE RADIO PROBLEM
  → Magic has never had Marquee or paid push. Hit 12K organic. Needs $200-250 Marquee NOW.
  → Distribution: Label Radar (Brett's plan) — NO Discovery Mode access. Options: upgrade plan or re-distribute through VMG/DSR.
- HIDDEN GEMS (high save ratio despite low streams = real fan engagement):
  → Make U Do: 15.8% save ratio | CRITICAL: 11.1% | This Is It: 10.9% | Work: 9.9% | The Grind: 9.1%
  → These tracks convert — they need Discovery Mode exposure
- Hip Swing (DSR159) + Tunnel Vision (DSR166): VMG/DSR distributed = Thomas can toggle Discovery Mode TODAY

MARQUEE HISTORY:
- 4 campaigns, $650 total spend
- Provision EP (Nov 2024): $250 spend, 29.9% save rate — top 5% of any Marquee campaign ever
- Audience wants to save WHOiSEE music. They just haven't found it yet.

ACTIVE DEAL:
- Circus Records UK EP — ACTIVE NEGOTIATION
- Key contacts: Holly Grainger (holly@circus-records.co.uk)
- Status: Artwork sidebar/title format decision pending

UPCOMING SHOWS (as support on DS tour):
- March 14 — Pittsburgh @ SideQuest (w/ DirtySnatcha, Dark Matter)
- April 24 — Asbury Park, NJ @ House of Independents (w/ DirtySnatcha, Dark Matter)
- April 25 — Hartford, CT (w/ DirtySnatcha)

VOICE: Direct, no fluff. WHOiSEE's brand is "if you know you know" — understated confidence. Not hype-beast, not corporate.

GUARDRAILS: Never give legal advice on the Circus deal — flag key terms, recommend music attorney. Never fabricate metrics.`,
  },
  darkmatter: {
    id: "darkmatter",
    name: "Dark Matter",
    label: "DirtySnatcha Records",
    color: "#06b6d4",
    accent: "#f97316",
    emoji: "🌌",
    tagline: "Heavy. Dark. Real.",
    passcode: "DM2026",
    profile: {
      real_name: "Dark Matter",
      genre: "Dubstep / Bass Music",
      location: "Chicago / Knoxville",
      manager: "Thomas Nalian — thomas@dirtysnatcha.com",
      label: "DirtySnatcha Records",
      status: "Active — Wakaan release",
      notable: "Wakaan label release (Liquid Stranger's label)",
    },
    systemPrompt: `You are an elite music industry AI agent for Dark Matter, managed by Thomas Nalian. Dark Matter is a managed artist on TENx10, independent of DSR label.

ARTIST DATA:
- Artist: Dark Matter | Based in: Chicago / Knoxville
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Label: Independent / Wakaan (not on DSR)
- Genre: Dubstep / Bass Music
- Tier: Development (Tier 1 support on DirtySnatcha tour)
- Notable: Wakaan release (Liquid Stranger's label — significant credibility marker)

UPCOMING SHOWS (as support on DS tour):
- March 14 — Pittsburgh @ SideQuest (w/ DirtySnatcha, WHOiSEE)
- April 24 — Asbury Park, NJ @ House of Independents (w/ DirtySnatcha, WHOiSEE)

PRIORITY ACTIONS:
- Wakaan release — maximize DSP push around release window
- Pittsburgh March 14 — confirm advance details with Thomas
- Build out release cadence for 2026 (6-week minimum rule between drops)

VOICE: Direct, no fluff. Dark Matter's brand is dark, heavy, cinematic bass. Atmospheric, intense.

GUARDRAILS: Never give legal advice. Never fabricate metrics. Never share other artists' financials.`,
  },
};

  kotrax: {
    id: "kotrax",
    name: "Kotrax",
    label: "DirtySnatcha Records",
    color: "#f97316",
    accent: "#a855f7",
    emoji: "⚡",
    tagline: "Bass music. No compromise.",
    passcode: "KT2026",
    profile: {
      real_name: "Kotrax",
      genre: "Dubstep / Bass Music",
      location: "US",
      manager: "Thomas Nalian — thomas@dirtysnatcha.com",
      label: "DirtySnatcha Records",
      status: "Active — DSR catalog artist",
    },
    systemPrompt: `You are an elite music industry AI agent for Kotrax, managed by Thomas Nalian. Kotrax is signed to DirtySnatcha Records (DSR), part of Thomas's managed roster on TENx10.

ARTIST DATA:
- Artist: Kotrax
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Label: DirtySnatcha Records (DSR) | Distributor: VMG
- Genre: Dubstep / Bass Music
- Tier: Development
- Catalog: 7 tracks on DSR

PRIORITY ACTIONS:
- Build release cadence for 2026 (6-week minimum rule between drops)
- Grow monthly listeners and save ratio
- Coordinate with Thomas on DSR release strategy

VOICE: Direct, no fluff. Bass music identity — heavy, purposeful. Not corporate.

GUARDRAILS: Never give legal advice. Never fabricate metrics. Never share other artists' financials.`,
  },
const MANAGER = {
  id: "manager",
  name: "Thomas Nalian",
  label: "Artist Management — Full Roster",
  color: "#f59e0b",
  accent: "#ef4444",
  emoji: "⚡",
  tagline: "4 artists. 1 label. Full control.",
  passcode: "TN2026",
  systemPrompt: `You are an elite music industry AI agent for Thomas Nalian, an artist manager who manages DirtySnatcha, WHOiSEE, Dark Matter, and Kotrax. He also runs DirtySnatcha Records (DSR), a record label distributed through Virgin Music Group.

MANAGER PROFILE:
- Thomas Nalian | thomas@dirtysnatcha.com | 248-765-1997
- Role: Artist Manager (primary) + Label Head (DirtySnatcha Records)
- Commission: 10% (agent booking) / 20% (direct booking)
- Label: DirtySnatcha Records (DSR) | Distributor: VMG
- Platform: TENx10

LABEL CATALOG:
- 154 releases (DSR002–DSR178), 220 tracks, 116 unique artists
- Date range: Oct 2019 – Feb 2026
- Genre: 98% Dubstep
- 2025 pace: 1 release every 10-11 days (34 releases)
- Distribution: 100% Virgin Music Group (VMG)

MANAGED ARTISTS (4):
1. DirtySnatcha (Leigh Bray) — headline artist. 136 tracks, 14M all-time streams, PS 28. Tour: 17 shows ~$38,600. Active release: "Drugs In Da Club" (Feb 27, 2026).
2. WHOiSEE (Brett, NC) — development. 28 tracks, 19K 28-day streams. Circus Records UK EP in progress. Hidden gems with 9-15% save ratios.
3. Dark Matter (Chicago/Knoxville) — development. Wakaan release. Support on DS tour.
4. Kotrax — development. 7 tracks on DSR catalog.

DSR LABEL (DirtySnatcha Records — separate from artist management):
- Thomas runs DSR as label head in addition to managing 4 artists
- 154 releases (DSR002–DSR178), 220 tracks, 116 roster artists
- Distributor: Virgin Music Group (VMG)
- Notable DSR artists: DirtySnatcha, Kotrax, OZZTIN, MAVIC, PRIYANX + 110 others

🔴 URGENT RIGHT NOW:
- Pittsburgh deposit $1,250 OVERDUE 18+ days — no promoter contact. Get from Colton immediately.
- Houston/Dallas artwork — Andrew Winters sent Drive link. Waiting for approval/billing decision.
- WHOiSEE Circus EP artwork — sidebar title format decision needed with Holly Grainger.
- Albuquerque March 6 — 3 days out, partial deposit only, no signed contract.
- DirtyT April 18 — 23 tickets sold, 227 remaining. Needs marketing push NOW.
- Adobe Sign: DirtySnatcha_Prysm_Mutual_Transition_and_Release — CONTRACT WAITING SIGNATURE.

🟡 THIS WEEK:
- Spokane counter offer ($3K) sent to Andrew Z — awaiting response
- Tampa venue TBD — 10 days out, at risk
- Butte May 2 — full advance needed
- WHOiSEE Magic Marquee — $200-250 campaign, DO NOT WAIT longer
- Drugs In Da Club — Day 5, launch Marquee before Day 10 window closes

VOICE: Elite manager. Direct, specific, blunt. Real dollar amounts, dates, names. 3 priorities not 20. Every recommendation has a CTA with who to contact and by when.`,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

// ─── CATALOG VIEW ─────────────────────────────────────────────────────────────

function DirtySnatcha_Catalog({ color }) {
  const [showAll, setShowAll] = useState(false);
  const top5pct = DS_CATALOG.slice(0, 5).reduce((a, t) => a + t.pct, 0);
  const top20pct = DS_CATALOG.slice(0, 20).reduce((a, t) => a + t.pct, 0);
  const visible = showAll ? DS_CATALOG : DS_CATALOG.slice(0, 15);
  const maxStreams = DS_CATALOG[0].streams;

  const eraGroups = {
    "2013–2018": DS_CATALOG.filter(t => parseInt(t.year) <= 2018),
    "2019–2021": DS_CATALOG.filter(t => parseInt(t.year) >= 2019 && parseInt(t.year) <= 2021),
    "2022–2023": DS_CATALOG.filter(t => parseInt(t.year) >= 2022 && parseInt(t.year) <= 2023),
    "2024–2026": DS_CATALOG.filter(t => parseInt(t.year) >= 2024),
  };
  const eraStreams = Object.fromEntries(
    Object.entries(eraGroups).map(([era, tracks]) => [
      era,
      tracks.reduce((a, t) => a + t.streams, 0),
    ])
  );
  const maxEra = Math.max(...Object.values(eraStreams));

  return (
    <div className="p-4 space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Tracks", val: DS_TOTAL_TRACKS, sub: "all-time" },
          { label: "Total Streams", val: fmt(DS_TOTAL_STREAMS), sub: "all-time Spotify" },
          { label: "Artist PS", val: "28", sub: "Popularity Score" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-lg font-black" style={{ color }}>{s.val}</div>
            <div className="text-xs font-semibold text-white mt-0.5">{s.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Concentration Alert */}
      <div className="rounded-xl p-4" style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.25)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⚠️</span>
          <span className="text-sm font-bold text-white">Catalog Concentration Crisis</span>
        </div>
        <div className="space-y-2">
          {[
            { label: "Top 1 track", pct: 27.7, desc: "I Need Your High (2019)" },
            { label: "Top 5 tracks", pct: top5pct, desc: "55% of all streams" },
            { label: "Top 20 tracks", pct: top20pct, desc: `${top20pct.toFixed(0)}% of all streams` },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                <span>{r.label}</span>
                <span style={{ color: "#ff003c" }}>{r.pct.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${r.pct}%`, background: "linear-gradient(90deg, #ff003c, #ff6b35)" }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
          Every new release fights algorithmic share against your own back catalog. Genie In A Bottle (2024) at 413K is the template to replicate — the only recent track in the top 5.
        </p>
      </div>

      {/* Active Release Highlight */}
      <div className="rounded-xl p-4" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
          <span className="text-sm font-bold" style={{ color }}>Active Release — Day 5</span>
        </div>
        <div className="text-base font-black text-white">Drugs In Da Club</div>
        <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Released Feb 27, 2026 · 13,773 streams</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Day 1 Saves", val: "495", sub: "10.3% rate ✅" },
            { label: "ML Growth", val: "+2,577", sub: "since release" },
            { label: "Status", val: "⚡ Go", sub: "Marquee by Day 10" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="text-sm font-bold" style={{ color }}>{s.val}</div>
              <div className="text-xs text-white">{s.label}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Era Breakdown */}
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-xs font-bold text-white mb-3 tracking-wider uppercase">Streams by Era</div>
        <div className="space-y-2.5">
          {Object.entries(eraStreams).map(([era, streams]) => (
            <div key={era}>
              <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                <span>{era}</span>
                <span>{fmt(streams)} streams</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(streams / maxEra) * 100}%`, background: color + "99" }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          2019–2021 era dominates. 2024+ releases showing traction — pace of new music is the lever.
        </p>
      </div>

      {/* Top Tracks Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-4 py-2.5 flex justify-between items-center"
          style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-xs font-bold text-white tracking-wider uppercase">Top Tracks</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>All-time Spotify</span>
        </div>
        <div className="divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
          {visible.map((t, i) => (
            <div key={t.song} className="px-4 py-2.5"
              style={{ background: t.active ? `${color}08` : "transparent" }}>
              <div className="flex items-center gap-3">
                <span className="text-xs w-5 text-right flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.2)" }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white truncate font-medium">{t.song}</span>
                    {t.active && (
                      <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-bold"
                        style={{ background: color + "22", color }}>LIVE</span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${(t.streams / maxStreams) * 100}%`,
                        background: t.active ? color : i < 5 ? "#ff003c99" : color + "55",
                      }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold" style={{ color: i === 0 ? "#ff003c" : "rgba(255,255,255,0.7)" }}>
                    {fmt(t.streams)}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{t.pct}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setShowAll(!showAll)}
          className="w-full py-2.5 text-xs transition-all"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            color: color
          }}>
          {showAll ? "Show less ↑" : `Show all ${DS_TOTAL_TRACKS} tracks ↓`}
        </button>
      </div>
    </div>
  );
}

function WHOiSEE_Catalog({ color }) {
  const [view, setView] = useState("all");
  const gems = WS_CATALOG.filter(t => t.flag === "gem");
  const passive = WS_CATALOG.filter(t => t.flag === "passive");
  const visible = view === "gems" ? gems : view === "passive" ? passive : WS_CATALOG;
  const avgSR = (WS_TOTAL_SAVES / WS_TOTAL_28D * 100).toFixed(1);

  return (
    <div className="p-4 space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Tracks", val: "28", sub: "28-day active" },
          { label: "28-Day Streams", val: fmt(WS_TOTAL_28D), sub: "Spotify" },
          { label: "Avg Save Ratio", val: avgSR + "%", sub: `floor: 5%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-lg font-black" style={{ color }}>{s.val}</div>
            <div className="text-xs font-semibold text-white mt-0.5">{s.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Magic Passive Problem */}
      <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span>⚠️</span>
          <span className="text-sm font-bold text-white">Magic — Passive Radio Problem</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-2xl font-black" style={{ color: "#ef4444" }}>63.6%</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>of all 28-day streams</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: "#ef4444" }}>3.7%</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>save ratio (floor: 5%)</div>
          </div>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          Magic hit 12K streams purely organic — zero paid push. Radio/Autoplay listeners don't save.
          Fix: Launch Marquee $200-250 targeting Programmed + Potential. Discovery Mode blocked by Label Radar plan tier.
        </p>
        <div className="mt-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="text-xs font-bold text-white mb-1">MARQUEE HISTORY</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Provision EP (Nov 2024): $250 spend → <span className="font-bold text-green-400">29.9% save rate</span> → top 5% of all Marquee campaigns ever. The audience saves when they find it.
          </div>
        </div>
      </div>

      {/* Hidden Gems */}
      <div className="rounded-xl p-4" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span>💎</span>
          <span className="text-sm font-bold text-white">Hidden Gems — High Conviction</span>
        </div>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
          These tracks have elite save ratios with minimal exposure. Real fan engagement. Discovery Mode would unlock them.
        </p>
        <div className="space-y-2">
          {gems.map((t) => (
            <div key={t.song} className="flex items-center justify-between py-2 px-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <div>
                <div className="text-xs font-bold text-white">{t.song}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{fmt(t.streams)} streams</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black" style={{ color: "#a855f7" }}>{t.sr}%</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>save ratio</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Track Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-4 py-2.5 flex justify-between items-center"
          style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-xs font-bold text-white tracking-wider uppercase">Full Catalog</span>
          <div className="flex gap-1">
            {[
              { id: "all", label: "All" },
              { id: "gems", label: `Gems (${gems.length})` },
              { id: "passive", label: `Passive (${passive.length})` },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className="text-xs px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: view === v.id ? color + "25" : "rgba(255,255,255,0.05)",
                  color: view === v.id ? color : "rgba(255,255,255,0.4)",
                  border: view === v.id ? `1px solid ${color}40` : "1px solid transparent"
                }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
          {visible.map((t, i) => {
            const flagColor = t.flag === "gem" ? "#a855f7" : t.flag === "strong" ? "#10b981" : "rgba(255,255,255,0.2)";
            const flagLabel = t.flag === "gem" ? "💎" : t.flag === "strong" ? "✅" : "📻";
            return (
              <div key={t.song} className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm w-5 flex-shrink-0">{flagLabel}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white font-medium truncate">{t.song}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${Math.max((t.sr / 16) * 100, 2)}%`,
                            background: flagColor
                          }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold" style={{ color: flagColor }}>
                      {t.sr > 0 ? t.sr + "%" : "—"}
                    </div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {fmt(t.streams)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          <span className="text-purple-400">💎 Gem</span> = save ratio &gt;8% · <span className="text-green-400">✅ Strong</span> = 5–8% · <span style={{ color: "rgba(255,255,255,0.4)" }}>📻 Passive</span> = below 5% floor
        </p>
      </div>
    </div>
  );
}

function Manager_Catalog({ color }) {
  return (
    <div className="p-4 space-y-5">
      {/* VMG Label Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "DSR Label Releases", val: VMG_CATALOG.releases, sub: "DSR002 → DSR178" },
          { label: "Total Tracks", val: VMG_CATALOG.tracks, sub: "across all releases" },
          { label: "Unique Artists", val: VMG_CATALOG.artists, sub: "on label" },
          { label: "Primary Genre", val: "Dubstep", sub: `${VMG_CATALOG.genres.Dubstep}/154 releases` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-xl font-black" style={{ color }}>{s.val}</div>
            <div className="text-xs font-semibold text-white mt-0.5">{s.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-xs font-bold text-white mb-1">VMG DISTRIBUTION</div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {VMG_CATALOG.dateRange} · {VMG_CATALOG.avgPace} · 100% Virgin Music Group
        </div>
      </div>

      {/* Artist Comparison */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-4 py-2.5" style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-xs font-bold text-white tracking-wider uppercase">Roster Overview</span>
        </div>
        {[
          {
            name: "DirtySnatcha", emoji: "🛸", color: "#00ff88",
            stats: ["136 tracks", "14M streams", "PS 28", "8-9K ML"],
            status: "🔴 Marquee Day 5",
          },
          {
            name: "WHOiSEE", emoji: "👁️", color: "#a855f7",
            stats: ["28 tracks", "19K 28d", "4.1% SR", "12K ML"],
            status: "🔴 Magic Marquee needed",
          },
          {
            name: "Dark Matter", emoji: "🌌", color: "#06b6d4",
            stats: ["Wakaan release", "Active touring", "—", "—"],
            status: "🟡 Advance pending",
          },
          {
            name: "Kotrax", emoji: "⚡", color: "#f97316",
            stats: ["7 DSR tracks", "Development", "—", "—"],
            status: "🟡 Active",
          },
        ].map((a) => (
          <div key={a.name} className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-3 mb-2">
              <span>{a.emoji}</span>
              <span className="text-sm font-bold text-white">{a.name}</span>
              <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.4)" }}>{a.status}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {a.stats.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: a.color + "18", color: a.color }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Genre breakdown */}
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-xs font-bold text-white mb-3 tracking-wider uppercase">Label Genre Distribution</div>
        {Object.entries(VMG_CATALOG.genres).map(([genre, count]) => (
          <div key={genre} className="mb-2">
            <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span>{genre}</span>
              <span>{count} releases ({(count / VMG_CATALOG.releases * 100).toFixed(1)}%)</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-full rounded-full" style={{ width: `${(count / VMG_CATALOG.releases) * 100}%`, background: color + "99" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogView({ entity }) {
  const color = entity.color;
  if (entity.id === "dirtysnatcha") return <DirtySnatcha_Catalog color={color} />;
  if (entity.id === "whoisee") return <WHOiSEE_Catalog color={color} />;
  if (entity.id === "manager") return <Manager_Catalog color={color} />;
  return (
    <div className="p-6 text-center">
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
        No catalog data available for {entity.name} yet.
      </p>
    </div>
  );
}

// ─── OVERVIEW VIEW ────────────────────────────────────────────────────────────

function OverviewView({ entity }) {
  const color = entity.color;
  const profile = entity.profile || {};

  if (entity.id === "manager") {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <div className="text-xs font-bold tracking-widest text-red-400 mb-3">🔴 URGENT — DO TODAY</div>
          <div className="space-y-2">
            {[
              "Pittsburgh deposit $1,250 OVERDUE 18+ days — call Colton NOW",
              "Adobe Sign: DirtySnatcha_Prysm transition contract awaiting signature",
              "Drugs In Da Club Marquee — Day 5, window closes Day 10",
              "WHOiSEE Magic Marquee — $200-250, every day waiting is passive Radio waste",
              "DirtyT April 18 — 23 tickets / 250 capacity. Marketing push TODAY",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                <span className="text-xs text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="text-xs font-bold tracking-widest mb-3" style={{ color: "#f59e0b" }}>🟡 THIS WEEK</div>
          <div className="space-y-2">
            {[
              "Spokane counter ($3K) — awaiting Andrew Z response",
              "Tampa March 13 — venue TBD, 10 days out, at risk",
              "Albuquerque March 6 — partial deposit only, no signed contract",
              "WHOiSEE Circus EP — artwork sidebar decision with Holly Grainger",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }}>•</span>
                <span className="text-xs text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-xs font-bold text-white tracking-widest mb-3">📊 ROSTER METRICS</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "DirtySnatcha ML", val: "41.4K", trend: "↑ +2.5K" },
              { label: "WHOiSEE ML", val: "12.1K", trend: "↑ rebuilt" },
              { label: "Tour Guaranteed", val: "$38,600", trend: "17 shows" },
              { label: "DSR Releases", val: "154", trend: "220 tracks" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-sm font-black text-white">{m.val}</div>
                <div className="text-xs text-white">{m.label}</div>
                <div className="text-xs mt-0.5" style={{ color: color }}>{m.trend}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (entity.id === "dirtysnatcha") {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <div className="text-xs font-bold tracking-widest text-red-400 mb-3">🔴 RIGHT NOW</div>
          <div className="space-y-2">
            {[
              "Pittsburgh deposit $1,250 OVERDUE 18+ days — no promoter contact",
              "Drugs In Da Club Marquee — Day 5, $200-250, launch before Day 10",
              "DirtyT April 18 — 23 tickets / 250 cap. Marketing push needed NOW",
            ].map(item => (
              <div key={item} className="flex gap-2">
                <span className="text-red-400 flex-shrink-0">•</span>
                <span className="text-xs text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Monthly Listeners", val: "41.4K", sub: "+2.5K since release" },
            { label: "Popularity Score", val: "28", sub: "target: 30+" },
            { label: "Tour Shows", val: "17", sub: "$38.6K guaranteed" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-base font-black" style={{ color }}>{s.val}</div>
              <div className="text-xs font-semibold text-white mt-0.5">{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-xs font-bold text-white tracking-widest mb-3">📅 UPCOMING SHOWS</div>
          {[
            { date: "Mar 6", city: "Albuquerque @ Effex", guarantee: "$2,000", status: "⚡ 3 days" },
            { date: "Mar 13", city: "Tampa", guarantee: "$2,000", status: "⚠️ At risk" },
            { date: "Mar 14", city: "Pittsburgh @ SideQuest", guarantee: "$2,500", status: "🔴 Deposit OD" },
            { date: "Apr 18", city: "DirtyT (Tucson)", guarantee: "—", status: "🎟 23 sold" },
            { date: "May 2", city: "Butte @ Covellite", guarantee: "$5,000", status: "✅ Confirmed" },
          ].map(s => (
            <div key={s.city} className="flex items-center justify-between py-1.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex gap-3 items-center">
                <span className="text-xs font-mono" style={{ color: color, minWidth: 40 }}>{s.date}</span>
                <span className="text-xs text-white">{s.city}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.guarantee}</span>
                <span className="text-xs">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entity.id === "whoisee") {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
          <div className="text-xs font-bold tracking-widest mb-3" style={{ color }}>🔴 PRIORITIES</div>
          <div className="space-y-2">
            {[
              "Magic Marquee — $200-250 campaign. Provision EP got 29.9% save rate. Launch NOW.",
              "Discovery Mode on Magic — upgrade Label Radar plan OR re-distribute through VMG/DSR",
              "Circus Records EP artwork — sidebar title format decision with Holly Grainger",
            ].map(item => (
              <div key={item} className="flex gap-2">
                <span style={{ color }} className="flex-shrink-0">•</span>
                <span className="text-xs text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Monthly Listeners", val: "12.1K", sub: "rebuilt organically" },
            { label: "28-Day Streams", val: "19K", sub: "Magic = 63.6%" },
            { label: "Avg Save Ratio", val: "4.1%", sub: "below 5% floor" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-base font-black" style={{ color }}>{s.val}</div>
              <div className="text-xs font-semibold text-white mt-0.5">{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-xs font-bold text-white tracking-widest mb-3">📅 UPCOMING SHOWS</div>
          {[
            { date: "Mar 14", city: "Pittsburgh @ SideQuest", role: "Support (DS + DM)" },
            { date: "Apr 24", city: "Asbury Park, NJ", role: "Support (DS + DM)" },
            { date: "Apr 25", city: "Hartford, CT", role: "Support (DS)" },
          ].map(s => (
            <div key={s.city} className="flex items-center justify-between py-1.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex gap-3 items-center">
                <span className="text-xs font-mono" style={{ color, minWidth: 40 }}>{s.date}</span>
                <span className="text-xs text-white">{s.city}</span>
              </div>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.role}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(profile).slice(0, 6).map(([k, v]) => (
          <div key={k} className="rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-xs capitalize mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {k.replace(/_/g, " ")}
            </div>
            <div className="text-xs font-semibold text-white leading-relaxed">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CHAT VIEW ────────────────────────────────────────────────────────────────

function Message({ msg, color }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
          ⚡
        </div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`}
        style={isUser ? {
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "#fff",
          borderRadius: "18px 18px 4px 18px"
        } : {
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          color: "rgba(255,255,255,0.88)",
          borderRadius: "18px 18px 18px 4px"
        }}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
        ⚡
      </div>
      <div className="px-4 py-3 rounded-2xl" style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "18px 18px 18px 4px"
      }}>
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: "rgba(255,255,255,0.35)", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatTab({ entity }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const color = entity.color;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (!initialized) { setInitialized(true); sendGreeting(); } }, []);

  const sendGreeting = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: entity.systemPrompt,
          messages: [{ role: "user", content: "Give me a quick status briefing — what matters most right now?" }]
        })
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.content?.[0]?.text || "Ready when you are." }]);
    } catch {
      setMessages([{ role: "assistant", content: "Connected. What do you need?" }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: entity.systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.content?.[0]?.text || "Something went wrong." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Try again." }]);
    }
    setLoading(false);
  };

  const quickPrompts = entity.id === "manager"
    ? ["Daily briefing", "What's overdue?", "Tour P&L", "Pittsburgh deposit"]
    : entity.id === "dirtysnatcha"
    ? ["What's urgent today?", "Marquee strategy", "DirtyT ticket count", "Content ideas"]
    : entity.id === "whoisee"
    ? ["Magic Marquee plan", "Circus Records status", "Discovery Mode options", "Release timing"]
    : entity.id === "kotrax"
    ? ["Release strategy", "DSP overview", "What should I focus on?", "Content ideas"]
    : ["Wakaan strategy", "Pittsburgh advance", "Content ideas", "What's urgent?"];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => <Message key={i} msg={m} color={color} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
      {messages.length <= 1 && !loading && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {quickPrompts.map((p, i) => (
            <button key={i} onClick={() => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
              {p}
            </button>
          ))}
        </div>
      )}
      <div className="px-4 pb-4 pt-2">
        <div className="flex gap-2 items-end rounded-2xl p-1" style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${loading ? color + "44" : "rgba(255,255,255,0.1)"}`,
          transition: "border-color 0.2s"
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm px-3 py-2"
            style={{ color: "rgba(255,255,255,0.9)", caretColor: color, maxHeight: "120px" }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 mr-1 transition-all"
            style={{
              background: input.trim() && !loading ? color : "rgba(255,255,255,0.08)",
              color: input.trim() && !loading ? "#000" : "rgba(255,255,255,0.25)"
            }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────


// ─── CONTENT CALENDAR DATA ─────────────────────────────────────────────────
// voice: DirtySnatcha (hype/raw/unapologetic), WHOiSEE (mysterious/understated),
//        Dark Matter (heavy/dark/minimal), Kotrax (building/energetic)

const CONTENT_CALENDAR = {

  dirtysnatcha: [
    // ── WEEK 1: Mar 3-9 — DITC acceleration window + ABQ recap ──
    { id:"ds001", date:"2026-03-04", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"ALBUQUERQUE 🛸🔥\n\nwent absolutely crazy. you guys showed UP. we pulling back up someday soon\n\n#dirtysnatcha #albuquerque #abq #dubstep #takemetoyourleader",
      asset:"Best crowd shot or stage photo from ABQ show", cta:"tag", priority:"high", artist:"dirtysnatcha",
      hashtagSet:"B — Tour + C — City (ABQ)" },
    { id:"ds002", date:"2026-03-04", time:"2:00 PM", platform:"IG Stories", postType:"Story",  category:"tour",
      caption:"ABQ RECAP — 3-slide story: best crowd shot → laser photo → setlist shot", 
      asset:"3 show photos, can be phone camera", cta:"tag", priority:"med", artist:"dirtysnatcha" },
    { id:"ds003", date:"2026-03-05", time:"7:00 PM", platform:"IG Reels / TikTok", postType:"Reel",  category:"tour",
      caption:"ABQ energy clip — no caption needed, let the footage talk 🛸\n\n#dubstep #bassmusic #abq #liveshow #riddim",
      asset:"15-30s live set clip, best bass drop moment, DITC as audio", cta:"follow", priority:"high", artist:"dirtysnatcha" },
    { id:"ds004", date:"2026-03-05", time:"12:00 PM", platform:"X / Twitter", postType:"Tweet", category:"release",
      caption:"Drugs In Da Club — day 7. go run it up 🛸 search my name on Spotify",
      asset:"Text only or track artwork", cta:"search", priority:"med", artist:"dirtysnatcha",
      algorithmNote:"'Search DirtySnatcha on Spotify' = #1 Artist PS driver. Direct links bypass the search signal. Never 'link in bio' on release CTAs." },
    { id:"ds005", date:"2026-03-06", time:"10:00 AM", platform:"IG Stories", postType:"Story",  category:"release",
      caption:"WHAT TRACK IS THIS 🛸 [15s DITC clip — no title shown, force the Shazam]\n[Add Shazam link sticker]",
      asset:"15-second DITC clip — do NOT show track name. Mystery is the point.", cta:"stream", priority:"high", artist:"dirtysnatcha" },
    { id:"ds006", date:"2026-03-06", time:"9:00 PM", platform:"TikTok", postType:"TikTok", category:"release",
      caption:"saving Drugs In Da Club tells the algorithm you fw it 🛸 go save it\n\n#drugsindaclub #dirtysnatcha #dubstep #spotify #spotifytips",
      asset:"Talking head selfie or screen record of Spotify save action", cta:"save", priority:"high", artist:"dirtysnatcha",
      tiktokTitle:"how to help your favorite artist on Spotify 2026 dubstep",
      engagementWindow:"Reply to EVERY comment within 2 hours of posting. TikTok weights early engagement heavily — first 2hr determines initial push size.",
      algorithmNote:"Make DITC available as a TikTok Sound. DM WHOiSEE, Kotrax, Dark Matter: post a video using DITC audio this week. 5-10 videos using same sound = trending signal." },
    { id:"ds007", date:"2026-03-07", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"release",
      caption:"Drugs In Da Club 🛸\n\nthis one hit different. week 1 in and still running. search my name on Spotify and save it if you haven't\n\n#drugsindaclub #dirtysnatcha #newmusic #dubstep",
      asset:"Track artwork or animated artwork graphic", cta:"search+save", priority:"high", artist:"dirtysnatcha",
      hashtagSet:"D — Release",
      algorithmNote:"Week 1 Day 9 — if Track PS approaching 20, this is the push post before Friday Release Radar refresh. Check Musicstax this morning. If score is 17-19, boost this post with $20 spend before 6pm." },

    // ── WEEK 2: Mar 8-15 — Tampa + Pittsburgh push + shows ──
    { id:"ds008", date:"2026-03-08", time:"6:00 PM", platform:"IG Reels / TikTok", postType:"Reel", category:"branding",
      caption:"studio mode 🛸 always cooking\n\n#dirtysnatcha #dubstep #producerlife #bassmusic #studio",
      asset:"DAW screenshot or screen record, studio setup, or production BTS clip", cta:"follow", priority:"med", artist:"dirtysnatcha",
      tiktokTitle:"dubstep producer makes a track from scratch 2026 DirtySnatcha",
      engagementWindow:"Reply to ALL comments within 2 hours. Ask anyone in comments to search DITC on Spotify if they haven't heard it.",
      algorithmNote:"🔁 CROSS-POST TASK: DM WHOiSEE + Kotrax + Dark Matter this weekend — ask them to post a TikTok using Drugs In Da Club as the audio. 5-10 creator videos using same sound = trending sound signal on TikTok." },
    { id:"ds009", date:"2026-03-09", time:"12:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"tour",
      caption:"FLORIDA 🛸🌴\n\nDirtySnatcha · Take Me To Your Leader Tour\nMarch 13 @ Tampa\nw/ Kotrax · Mport · HVRCRFT\n\nSpring Break just got a whole lot heavier 👽🔥\n\ntickets in bio 🔗\n\n#dirtysnatcha #tampa #florida #dubstep #springbreak2026 #bassmusic",
      asset:"Tampa tour flyer — needs venue name filled in", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds010", date:"2026-03-09", time:"4:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"tour",
      caption:"PITTSBURGH THIS SATURDAY 🛸🔥\n\nSideQuest · March 14\nw/ WHOiSEE · Dark Matter\n\nPGH is ready for this\n\ntickets in bio\n\n#dirtysnatcha #pittsburgh #pgh #dubstep #sidequest #bassmusic",
      asset:"Pittsburgh tour flyer", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds011", date:"2026-03-11", time:"7:00 PM", platform:"IG Reels / TikTok", postType:"Reel", category:"tour",
      caption:"Spring Break but make it dubstep 🌴👽🔥\n\nTampa · March 13\nDirtySnatcha + Kotrax + Mport + HVRCRFT\n\nthis is not your average spring break party 🛸\n\n#tampa #springbreak #dubstep #bassmusic #dirtysnatcha #florida",
      asset:"15-sec hype clip — beach energy + live bass drop footage, DITC as audio", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds012", date:"2026-03-11", time:"10:00 AM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"PITTSBURGH SATURDAY 🛸 WHOiSEE + Dark Matter on the bill. PGH is not ready\n[Tag @whoiseemusic @darkmattermusic]",
      asset:"Support artist graphic featuring WHOiSEE + Dark Matter", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds013", date:"2026-03-12", time:"12:00 PM", platform:"X / Twitter", postType:"Tweet", category:"tour",
      caption:"FL TOMORROW. PGH SATURDAY. the aliens don't stop 🛸",
      asset:"Text only", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds014", date:"2026-03-12", time:"9:00 PM", platform:"IG Stories / TikTok", postType:"Story", category:"tour",
      caption:"TAMPA TOMORROW 🛸🌴 PITTSBURGH SATURDAY 🔥\n[Countdown sticker to Tampa show]",
      asset:"Double show graphic or split flyer", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds015", date:"2026-03-13", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"GAME DAY 🛸🌴 Tampa pulling up — travel BTS, soundcheck, venue walk",
      asset:"Phone camera — travel/arrival/soundcheck footage", cta:"tag", priority:"high", artist:"dirtysnatcha" },
    { id:"ds016", date:"2026-03-13", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"TONIGHT. TAMPA. 🛸\n[Add ticket link sticker if any still available]",
      asset:"Hype graphic — Tampa show info + TONIGHT text", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds017", date:"2026-03-14", time:"2:00 PM", platform:"IG Reels / TikTok / YouTube", postType:"Reel", category:"tour",
      caption:"TAMPA 🛸🌴 Spring Break dubstep invasion. we don't miss\n\n#tampa #dirtysnatcha #dubstep #springbreak #bassmusic #liveshow",
      asset:"Tampa show recap clip — best bass drop + crowd reaction, 20-30 sec", cta:"follow", priority:"high", artist:"dirtysnatcha" },
    { id:"ds018", date:"2026-03-14", time:"7:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"PITTSBURGH TONIGHT 🛸🔥 SideQuest. game day — soundcheck BTS",
      asset:"Pittsburgh venue + soundcheck BTS", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds015b", date:"2026-03-15", time:"12:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"TAMPA + PITTSBURGH WENT OFF 🔥🔥\n\ntwo shows. two cities. zero chill. thank you FL and PGH — we see you 🛸🙏\n\n#dirtysnatcha #tampa #pittsburgh #dubstep #takemetoyourleader",
      asset:"Best photo from Tampa or Pittsburgh (or side-by-side collage)", cta:"tag", priority:"high", artist:"dirtysnatcha" },

    // ── WEEK 3: Mar 16-22 — Recovery + DITC push + Lincoln Mar 21 ──
    { id:"ds019", date:"2026-03-16", time:"7:00 PM", platform:"IG Reels / TikTok", postType:"Reel", category:"branding",
      caption:"always cooking 🛸 tour mode but the studio doesn't stop\n\n#dirtysnatcha #producer #dubstep #bassmusic #studio",
      asset:"Studio session clip — DAW, headphones on, late night energy", cta:"follow", priority:"med", artist:"dirtysnatcha",
      tiktokTitle:"dubstep producer studio session behind the scenes DirtySnatcha 2026",
      hashtagSet:"A — Genre",
      algorithmNote:"Background task: confirm DITC is set as Featured Track in Pandora AMP (8-week run). Record Pandora Artist Audio Message (15-30 sec tour promo). WARNING: Pandora is ruthless — early thumbs-down permanently deprioritizes. Don't push to wrong audience." },
    { id:"ds020", date:"2026-03-17", time:"10:00 AM", platform:"IG Stories", postType:"Story", category:"release",
      caption:"Drugs In Da Club update 🛸 [share milestone — streams + saves] search my name on Spotify to help the count\n[Spotify link sticker]",
      asset:"Stream stats graphic from S4A", cta:"search+save", priority:"med", artist:"dirtysnatcha",
      algorithmNote:"⏰ TIMING CRITICAL: Discover Weekly refreshes MONDAY. Check Musicstax THIS MORNING. If Track PS is 27-29 → this story becomes URGENT — boost with $20-30 spend before midnight Sunday to push past 30 before Monday refresh. PS 30+ = Discover Weekly placement." },
    { id:"ds021", date:"2026-03-18", time:"9:00 PM", platform:"TikTok", postType:"TikTok", category:"branding",
      caption:"dubstep aliens don't take days off 👽🛸\n\n#dirtysnatcha #dubstep #alienhumor #bassmusic #fyp",
      asset:"Alien humor meme or on-brand trending audio clip", cta:"follow", priority:"low", artist:"dirtysnatcha" },
    { id:"ds022", date:"2026-03-19", time:"6:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"tour",
      caption:"NEBRASKA 🛸\n\nLincoln this Saturday. Sidebar.\n\npulling up with the heavy stuff. don't sleep\n\ntickets in bio\n\n#dirtysnatcha #lincoln #nebraska #dubstep #bassmusic",
      asset:"Lincoln tour flyer", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds023", date:"2026-03-20", time:"6:00 PM", platform:"IG Reels / TikTok", postType:"Reel", category:"branding",
      caption:"tour highlights so far 🛸🔥 ABQ → Tampa → Pittsburgh\n\n#dirtysnatcha #takemetoyourleader #dubstep #tourlife #bassmusic",
      asset:"Quick cut 20-sec tour montage — best moments from ABQ, Tampa, Pittsburgh", cta:"follow", priority:"med", artist:"dirtysnatcha" },
    { id:"ds024", date:"2026-03-21", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"LINCOLN TONIGHT 🛸 Sidebar. game day setup",
      asset:"BTS show day — hotel, drive, venue arrival", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds025", date:"2026-03-21", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"TONIGHT. LINCOLN. SIDEBAR. 🛸\n[Ticket link sticker]",
      asset:"TONIGHT hype graphic", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds026", date:"2026-03-22", time:"12:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"LINCOLN 🛸🙏 Nebraska always shows up. thank you Sidebar\n\n#dirtysnatcha #lincoln #nebraska #dubstep",
      asset:"Best crowd or stage photo from Lincoln", cta:"tag", priority:"high", artist:"dirtysnatcha" },

    // ── WEEK 4: Mar 23-29 — OKC Mar 27 + Tulsa Mar 28 ──
    { id:"ds027", date:"2026-03-23", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"OKLAHOMA 🛸🔥\n\nOKC Friday. Tulsa Saturday. the aliens hit the midwest back to back\n\ntickets in bio\n\n#dirtysnatcha #oklahoma #okc #tulsa #dubstep #bassmusic",
      asset:"OKC + Tulsa double flyer or split graphic", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds028", date:"2026-03-24", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"TikTok", category:"tour",
      caption:"pulling up to Oklahoma this week with the dubstep invasion 🛸👽 OKC Friday · Tulsa Saturday\n\n#oklahoma #okc #tulsa #dubstep #dirtysnatcha #bassmusic",
      asset:"Talking head selfie — casual, hype, announcing the double weekend", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds029", date:"2026-03-25", time:"10:00 AM", platform:"IG Stories", postType:"Story", category:"release",
      caption:"tell Alexa to play Drugs In Da Club 🛸 [branded Alexa CTA graphic]",
      asset:"Alexa CTA branded graphic", cta:"stream", priority:"med", artist:"dirtysnatcha",
      algorithmNote:"Amazon voice search signal. 'Hey Alexa, play Drugs In Da Club by DirtySnatcha' = Amazon Music algorithmic push. Confirm lyrics synced in Musixmatch for 'Hey Siri' matching too. Run minimum 2 Alexa CTAs per week." },
    { id:"ds030", date:"2026-03-26", time:"9:00 PM", platform:"IG Stories / TikTok", postType:"Story", category:"tour",
      caption:"OKC TOMORROW 🛸 TULSA SATURDAY 🔥 back to back. Oklahoma is not ready\n[Countdown sticker to Friday show]",
      asset:"Double show countdown graphic", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds031", date:"2026-03-27", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"GAME DAY. OKC 🛸 pulling up",
      asset:"Travel/arrival BTS phone camera", cta:"tag", priority:"high", artist:"dirtysnatcha" },
    { id:"ds032", date:"2026-03-27", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"TONIGHT. OKC. 🛸🔥",
      asset:"TONIGHT hype graphic", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds033", date:"2026-03-28", time:"2:00 PM", platform:"IG Reels / TikTok", postType:"Reel", category:"tour",
      caption:"OKC last night 🛸🔥 now pulling up to Tulsa — no days off\n\n#okc #tulsa #dirtysnatcha #dubstep",
      asset:"OKC quick recap clip (15 sec) → transition to Tulsa travel", cta:"follow", priority:"high", artist:"dirtysnatcha" },
    { id:"ds034", date:"2026-03-29", time:"12:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"OKC + TULSA 🛸🔥🔥 Oklahoma ate this weekend. both nights went crazy. thank you\n\n#dirtysnatcha #oklahoma #dubstep #takemetoyourleader",
      asset:"Best photo from OKC or Tulsa", cta:"tag", priority:"high", artist:"dirtysnatcha" },

    // ── WEEK 5-6: Apr 1-12 — Denver + KC + Tucson build ──
    { id:"ds035", date:"2026-03-31", time:"7:00 PM", platform:"IG Reels / TikTok", postType:"Reel", category:"branding",
      caption:"on the road. always. 🛸\n\nbehind the scenes of Take Me To Your Leader 2026\n\n#dirtysnatcha #tourlife #dubstep #bassmusic",
      asset:"Tour diary clip — windshield, hotel room, van life, city shots", cta:"follow", priority:"med", artist:"dirtysnatcha" },
    { id:"ds036", date:"2026-04-02", time:"6:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"tour",
      caption:"DENVER 🛸🏔️ this Saturday. Colorado we're pulling up\n\ntickets in bio\n\n#dirtysnatcha #denver #colorado #dubstep #bassmusic",
      asset:"Denver tour flyer", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds037", date:"2026-04-04", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"DENVER TONIGHT 🛸🏔️ game day",
      asset:"BTS arrival Denver", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds038", date:"2026-04-05", time:"12:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"DENVER 🛸🙏 Colorado always goes crazy. thank you\n\n#dirtysnatcha #denver #colorado #dubstep",
      asset:"Best Denver show photo", cta:"tag", priority:"high", artist:"dirtysnatcha" },
    { id:"ds039", date:"2026-04-07", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"KANSAS CITY 🛸🔥 next Friday. MO we're coming\n\ntickets in bio\n\n#dirtysnatcha #kansascity #missouri #dubstep",
      asset:"Kansas City tour flyer", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds040", date:"2026-04-09", time:"9:00 AM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"TUCSON APRIL 18 🛸 DirtyT. if you're in Arizona — link in bio. 227 tickets left. don't sleep",
      asset:"DirtyT / Tucson Rialto flyer", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds041", date:"2026-04-10", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"KANSAS CITY TONIGHT 🛸🔥",
      asset:"TONIGHT KC graphic", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds042", date:"2026-04-11", time:"12:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"KC 🛸 went off. thank you Kansas City 🔥\n\n#dirtysnatcha #kansascity #dubstep",
      asset:"KC show photo", cta:"tag", priority:"high", artist:"dirtysnatcha" },
    { id:"ds043", date:"2026-04-14", time:"6:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"tour",
      caption:"TUCSON THIS SATURDAY 🛸🌵\n\nRialto Theatre · April 18\nDirtyT fest vibes. this show is special\n\ntickets in bio — moving fast\n\n#dirtysnatcha #tucson #arizona #dirtyt #rialto #dubstep",
      asset:"DirtyT / Rialto Theatre flyer", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds044", date:"2026-04-16", time:"9:00 PM", platform:"TikTok / IG Reels", postType:"TikTok", category:"tour",
      caption:"TUCSON SATURDAY 🛸🌵 Rialto Theatre. Arizona come through — this lineup goes HARD\n\n#tucson #arizona #dubstep #dirtysnatcha #dirtyt",
      asset:"Talking head energy clip — hype for DirtyT", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds045", date:"2026-04-18", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"TONIGHT. TUCSON. RIALTO. 🛸🌵 DirtyT. game day",
      asset:"DirtyT show day BTS", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds046", date:"2026-04-19", time:"12:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"TUCSON 🛸🌵🔥 Rialto Theatre went absolutely crazy. Arizona — you showed UP\n\n#dirtysnatcha #tucson #dirtyt #arizona #dubstep",
      asset:"Best DirtyT show photo", cta:"tag", priority:"high", artist:"dirtysnatcha" },

    // ── WEEKS 7-9: Apr 20 - May 2 — NJ, Hartford, Butte finish ──
    { id:"ds047", date:"2026-04-21", time:"6:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"tour",
      caption:"EAST COAST 🛸🔥\n\nAsbury Park Friday · Hartford Saturday\n\nHouse of Independents + CT stop — the northeast run\n\ntickets in bio\n\n#dirtysnatcha #asburypark #newjersey #hartford #connecticut #dubstep",
      asset:"East Coast double flyer — Asbury Park + Hartford", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds048", date:"2026-04-24", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"ASBURY PARK TONIGHT 🛸 House of Independents. NJ let's go",
      asset:"House of Independents venue shot or TONIGHT graphic", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds049", date:"2026-04-25", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"HARTFORD TONIGHT 🛸 CT we're pulling up",
      asset:"TONIGHT Hartford graphic", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds050", date:"2026-04-26", time:"12:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"NJ + CT 🛸🔥 two more nights in the books. East Coast always shows love. thank you 🙏\n\n#dirtysnatcha #newjersey #connecticut #dubstep #takemetoyourleader",
      asset:"Best photo from Asbury Park or Hartford", cta:"tag", priority:"high", artist:"dirtysnatcha" },
    { id:"ds051", date:"2026-04-28", time:"6:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"tour",
      caption:"BUTTE, MONTANA 🛸🏔️\n\nMay 2 · Covellite Theatre\nMAD Series\n\ntour finale. this one's going to be something special\n\ntickets in bio\n\n#dirtysnatcha #butte #montana #covellite #madseries #dubstep",
      asset:"Butte / Covellite Theatre flyer — MAD Series branding", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds052", date:"2026-04-30", time:"9:00 PM", platform:"TikTok / IG Reels", postType:"TikTok", category:"tour",
      caption:"tour finale in 2 days 🛸🏔️ Butte Montana · Covellite Theatre · MAD Series\n\nif you're anywhere near Montana — do NOT miss this\n\n#montana #butte #dubstep #dirtysnatcha #madseries",
      asset:"Talking head — personal, hype, tour wrap energy", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds053", date:"2026-05-02", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"TOUR FINALE. BUTTE. TONIGHT 🛸🏔️ Covellite Theatre. game day",
      asset:"Covellite Theatre arrival/soundcheck BTS", cta:"tickets", priority:"high", artist:"dirtysnatcha" },
    { id:"ds054", date:"2026-05-03", time:"12:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"tour",
      caption:"Take Me To Your Leader 2026 🛸🙏\n\n17 cities. 17 nights. we went everywhere.\n\nthank you to everyone who came out. this tour was absolutely insane 🔥\n\n#dirtysnatcha #takemetoyourleader #tourwrap #dubstep #bassmusic",
      asset:"Tour wrap collage — one photo from every city, 17-grid or montage", cta:"follow", priority:"high", artist:"dirtysnatcha" },
  ],

  whoisee: [
    // ── BRAND + DSP FOCUS: Mar 3-31 ──
    { id:"ws001", date:"2026-03-04", time:"7:00 PM", platform:"IG / TikTok", postType:"Reel", category:"release",
      caption:"magic 👁️\n\nidk how this keeps finding new people but i'm not mad about it\n\n#whoisee #magic #dubstep #bassmusic",
      asset:"Animated track artwork or moody visual — dark, minimalist", cta:"search+save", priority:"high", artist:"whoisee",
      tiktokTitle:"dark dubstep track that keeps finding people 2026 WHOiSEE Magic",
      hashtagSet:"A — Genre + D — Release",
      engagementWindow:"Reply to comments within 2 hours. For anyone asking where to find it: 'search WHOiSEE on Spotify' — never just drop a link." },
    { id:"ws002", date:"2026-03-05", time:"10:00 AM", platform:"IG Stories", postType:"Story", category:"release",
      caption:"if you've heard Magic — save it AND search WHOiSEE on Spotify. it tells the algorithm you fw it 👁️\n[Spotify link sticker]",
      asset:"Save CTA story graphic — simple, dark background, white text", cta:"search+save", priority:"high", artist:"whoisee",
      algorithmNote:"Magic is at 3.7% save ratio — well below the 5% floor. Search signal + save in same post = dual PS push. Magic has never had Marquee. Even $200 at Provision EP 29.9% save rate template = significant score movement." },
    { id:"ws003", date:"2026-03-07", time:"6:00 PM", platform:"IG", postType:"Feed Post", category:"branding",
      caption:"if you know you know 👁️\n\n#whoisee #bassmusic #dubstep",
      asset:"Moody brand photo — dark aesthetic, mysterious vibe, logo overlay", cta:"follow", priority:"med", artist:"whoisee" },
    { id:"ws004", date:"2026-03-09", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"PITTSBURGH 🛸 Saturday March 14 · SideQuest\n\nsupporting @dirtysnatcha on the Take Me To Your Leader tour\n\nthis one's going to be heavy 👁️🔥\n\ntickets in bio\n\n#whoisee #pittsburgh #dubstep #bassmusic",
      asset:"Pittsburgh show flyer or WHOiSEE x DS graphic", cta:"tickets", priority:"high", artist:"whoisee" },
    { id:"ws005", date:"2026-03-11", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"branding",
      caption:"been sitting on some new stuff 👁️ it's ready\n\n#whoisee #newmusic #dubstep #bassmusic",
      asset:"Short teaser — dark studio clip, no track name, 10-15 sec mystery tease", cta:"follow", priority:"med", artist:"whoisee" },
    { id:"ws006", date:"2026-03-13", time:"7:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"Pittsburgh tomorrow 👁️🛸 @dirtysnatcha Take Me To Your Leader · SideQuest · support sets go hard",
      asset:"WHOiSEE x DirtySnatcha story graphic", cta:"tickets", priority:"high", artist:"whoisee" },
    { id:"ws007", date:"2026-03-14", time:"2:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"PITTSBURGH TONIGHT 👁️🔥 SideQuest. first time in PGH. let's get it",
      asset:"SideQuest venue photo or TONIGHT graphic", cta:"tickets", priority:"high", artist:"whoisee" },
    { id:"ws008", date:"2026-03-15", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"Pittsburgh 🙏 first time in PGH and y'all did not disappoint. thank you SideQuest\n\n#whoisee #pittsburgh #sidequest #dubstep",
      asset:"Best WHOiSEE Pittsburgh show photo", cta:"follow", priority:"high", artist:"whoisee" },
    { id:"ws009", date:"2026-03-17", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"Make U Do 👁️\n\none of my favorites I've put out. if you slept on this one go listen\n\n#whoisee #makeyoudo #dubstep #bassmusic #underrated",
      asset:"Animated Make U Do artwork or moody B-roll visual", cta:"search+save", priority:"high", artist:"whoisee",
      tiktokTitle:"underrated dubstep track WHOiSEE Make U Do hidden gem bass",
      algorithmNote:"Make U Do has 15.8% save ratio on tiny exposure. This post is a stealth PS spike. Directing discovery here compounds WHOiSEE Artist PS without needing a new release." },
    { id:"ws010", date:"2026-03-18", time:"10:00 AM", platform:"IG Stories", postType:"Story", category:"release",
      caption:"CRITICAL 👁️ — go listen. 11% of people who hear it save it. that's not nothing\n[Spotify link sticker]",
      asset:"CRITICAL track artwork graphic", cta:"save", priority:"high", artist:"whoisee" },
    { id:"ws011", date:"2026-03-20", time:"6:00 PM", platform:"IG", postType:"Feed Post", category:"branding",
      caption:"always working 👁️\n\n#whoisee #studio #producer #dubstep #bassmusic",
      asset:"Studio BTS — dark, moody, late night vibe", cta:"follow", priority:"med", artist:"whoisee" },
    { id:"ws012", date:"2026-03-24", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"This Is It 👁️\n\nsome tracks just hit different at 2am\n\n#whoisee #thisisit #bassmusic #dubstep",
      asset:"This Is It artwork or late night moody visual", cta:"save", priority:"med", artist:"whoisee" },
    { id:"ws013", date:"2026-03-26", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"release",
      caption:"Magic is about to have new company 👁️ something coming soon [teaser]",
      asset:"Cryptic teaser graphic — no title, just a date or question mark", cta:"follow", priority:"high", artist:"whoisee" },
    { id:"ws014", date:"2026-03-28", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"branding",
      caption:"👁️\n\n(something is coming)\n\n#whoisee",
      asset:"Mysterious minimal graphic — WHOiSEE logo only, dark background", cta:"follow", priority:"high", artist:"whoisee" },

    // ── APRIL: Circus EP push + continued DSP ──
    { id:"ws015", date:"2026-04-01", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"Hip Swing 👁️\n\nif you haven't heard this one yet — listen once. you'll know\n\n#whoisee #hipswing #dubstep #bassmusic",
      asset:"Hip Swing artwork or club energy visual", cta:"save", priority:"high", artist:"whoisee" },
    { id:"ws016", date:"2026-04-04", time:"6:00 PM", platform:"IG", postType:"Feed Post", category:"branding",
      caption:"NC built different 👁️\n\n#whoisee #northcarolina #bassmusic #dubstep",
      asset:"NC hometown photo or brand shot", cta:"follow", priority:"med", artist:"whoisee" },
    { id:"ws017", date:"2026-04-07", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"release",
      caption:"Circus EP 👁️ 🎪 coming soon\n[teaser — Circus Records UK logo]",
      asset:"Circus Records UK collab teaser graphic", cta:"follow", priority:"high", artist:"whoisee" },
    { id:"ws018", date:"2026-04-09", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"Tunnel Vision 👁️\n\nbeen running this one back since I finished it. it's different\n\n#whoisee #tunnelvision #dubstep #bassmusic",
      asset:"Tunnel Vision artwork or dark motion graphic", cta:"save", priority:"high", artist:"whoisee" },
    { id:"ws019", date:"2026-04-14", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"release",
      caption:"Circus EP 👁️🎪\n\nsomething big coming with @circusrecords\n\nif you know Circus you know what this means\n\n#whoisee #circus #circusrecords #dubstep #ep",
      asset:"Official Circus Records x WHOiSEE announcement graphic", cta:"follow", priority:"high", artist:"whoisee" },
    { id:"ws020", date:"2026-04-18", time:"6:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"release",
      caption:"EP artwork 👁️ [drop artwork reveal]\n\n#whoisee #ep #circusrecords #dubstep",
      asset:"EP artwork — full quality reveal post", cta:"pre-save", priority:"high", artist:"whoisee" },
    { id:"ws021", date:"2026-04-21", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"EP dropping soon 👁️🎪 here's a taste\n\n#whoisee #ep #dubstep #circusrecords #newmusic",
      asset:"15-sec EP teaser — hardest moment of a lead single, no title shown", cta:"pre-save", priority:"high", artist:"whoisee" },
    { id:"ws022", date:"2026-04-25", time:"6:00 PM", platform:"IG / FB / X", postType:"Feed Post", category:"release",
      caption:"pre-save is live 👁️\n\nCircus EP. dates soon.\n\nlink in bio\n\n#whoisee #presave #circusrecords #dubstep #ep",
      asset:"Pre-save landing page graphic", cta:"pre-save", priority:"high", artist:"whoisee" },
    { id:"ws023", date:"2026-04-28", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"release",
      caption:"EP drops in 7 days 👁️🎪\n[Countdown sticker · pre-save link sticker]",
      asset:"Countdown story graphic — EP artwork + 7 days", cta:"pre-save", priority:"high", artist:"whoisee" },
  ],

  darkmatter: [
    // ── TOUR SUPPORT + WAKAAN + BRANDING ──
    { id:"dm001", date:"2026-03-05", time:"7:00 PM", platform:"IG / TikTok", postType:"Reel", category:"branding",
      caption:"heavy. 🌌\n\n#darkmatter #dubstep #bassmusic #wakaan",
      asset:"Darkest live clip or production visual — no text, let the drop speak", cta:"follow", priority:"med", artist:"darkmatter" },
    { id:"dm002", date:"2026-03-09", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"Pittsburgh 🛸⚫ March 14 · SideQuest\n\nsupporting @dirtysnatcha on the Take Me To Your Leader tour\n\nDark Matter + WHOiSEE opening the night\n\ntickets in bio\n\n#darkmatter #pittsburgh #sidequest #dubstep #bassmusic",
      asset:"Pittsburgh show flyer featuring Dark Matter", cta:"tickets", priority:"high", artist:"darkmatter" },
    { id:"dm003", date:"2026-03-13", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"Pittsburgh tomorrow 🌌 SideQuest · supporting @dirtysnatcha",
      asset:"Dark Matter x DirtySnatcha tour graphic", cta:"tickets", priority:"high", artist:"darkmatter" },
    { id:"dm004", date:"2026-03-14", time:"8:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"TONIGHT. SideQuest. Pittsburgh. 🌌",
      asset:"SideQuest venue graphic + Dark Matter logo", cta:"tag", priority:"high", artist:"darkmatter" },
    { id:"dm005", date:"2026-03-15", time:"2:00 PM", platform:"IG", postType:"Feed Post", category:"tour",
      caption:"Pittsburgh 🌌 first time here. won't be the last. thank you SideQuest\n\n#darkmatter #pittsburgh #dubstep",
      asset:"Best live shot from Pittsburgh — dark, moody edit", cta:"follow", priority:"high", artist:"darkmatter" },
    { id:"dm006", date:"2026-03-19", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"Wakaan 🌌 heavy\n\nif you know Liquid Stranger's label you know the standard we hold ourselves to\n\n#darkmatter #wakaan #dubstep #liquidsranger #bassmusic",
      asset:"Wakaan release artwork or dark motion graphic", cta:"save", priority:"high", artist:"darkmatter" },
    { id:"dm007", date:"2026-03-24", time:"6:00 PM", platform:"IG", postType:"Feed Post", category:"branding",
      caption:"always in the studio 🌌⚫\n\nnew music coming\n\n#darkmatter #producer #dubstep #bassmusic",
      asset:"Late-night studio shot — dark, moody, minimal", cta:"follow", priority:"med", artist:"darkmatter" },
    { id:"dm008", date:"2026-04-01", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"this is what we do 🌌\n\n#darkmatter #dubstep #bassmusic #heavymetal #bass",
      asset:"Hardest 15-sec of Wakaan release — dark energy clip", cta:"save", priority:"high", artist:"darkmatter" },
    { id:"dm009", date:"2026-04-07", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"branding",
      caption:"Chicago. Knoxville. everywhere. 🌌\n\n#darkmatter #chicago #knoxville #dubstep",
      asset:"City/hometown brand photo or dual-city graphic", cta:"follow", priority:"med", artist:"darkmatter" },
    { id:"dm010", date:"2026-04-15", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"new music incoming 🌌⚫\n\n#darkmatter #newmusic #dubstep #bassmusic",
      asset:"Studio teaser — 10 sec, no title, dark vibe", cta:"follow", priority:"high", artist:"darkmatter" },
    { id:"dm011", date:"2026-04-22", time:"6:00 PM", platform:"IG", postType:"Feed Post", category:"release",
      caption:"🌌\n\n(something heavy is coming)\n\n#darkmatter",
      asset:"Cryptic teaser graphic — dark background, minimal text", cta:"follow", priority:"high", artist:"darkmatter" },
    { id:"dm012", date:"2026-04-28", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"releasing this one soon 🌌 stay tuned\n\n#darkmatter #dubstep #newmusic #bassmusic",
      asset:"15-sec teaser of upcoming track — anonymous drop", cta:"follow", priority:"high", artist:"darkmatter" },
  ],

  kotrax: [
    // ── TOUR SUPPORT + DSR CATALOG + BRANDING ──
    { id:"kt001", date:"2026-03-05", time:"7:00 PM", platform:"IG / TikTok", postType:"Reel", category:"branding",
      caption:"bass music. no filter. ⚡\n\n#kotrax #dubstep #bassmusic #dsr",
      asset:"Live energy clip or studio session — raw, unfiltered", cta:"follow", priority:"med", artist:"kotrax" },
    { id:"kt002", date:"2026-03-09", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"tour",
      caption:"ALBUQUERQUE 🛸⚡ March 6 with @dirtysnatcha\n\nwe had ABQ going crazy. thank you Effex for having us\n\n#kotrax #albuquerque #dubstep #dirtysnatcha #takemetoyourleader",
      asset:"Best Kotrax shot from ABQ show", cta:"follow", priority:"high", artist:"kotrax" },
    { id:"kt003", date:"2026-03-12", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"Tampa tomorrow ⚡🌴 supporting @dirtysnatcha · take me to your leader tour",
      asset:"Tampa show graphic featuring Kotrax", cta:"tickets", priority:"high", artist:"kotrax" },
    { id:"kt004", date:"2026-03-13", time:"8:00 PM", platform:"IG Stories", postType:"Story", category:"tour",
      caption:"TONIGHT. Tampa. ⚡🌴 let's get it",
      asset:"TONIGHT Tampa graphic", cta:"tag", priority:"high", artist:"kotrax" },
    { id:"kt005", date:"2026-03-14", time:"2:00 PM", platform:"IG", postType:"Feed Post", category:"tour",
      caption:"FLORIDA ⚡🌴 Tampa spring break dubstep invasion. we don't miss\n\nthank you @dirtysnatcha for having us on this tour\n\n#kotrax #tampa #florida #dubstep #takemetoyourleader",
      asset:"Best Kotrax Tampa show photo", cta:"follow", priority:"high", artist:"kotrax" },
    { id:"kt006", date:"2026-03-18", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"DSR catalog ⚡ go stream it\n\n#kotrax #dsr #dirtysnatcharecords #dubstep #bassmusic",
      asset:"Best DSR release clip or animated artwork", cta:"stream", priority:"high", artist:"kotrax" },
    { id:"kt007", date:"2026-03-22", time:"6:00 PM", platform:"IG", postType:"Feed Post", category:"branding",
      caption:"cooking ⚡\n\nnew music almost ready\n\n#kotrax #dubstep #producer #bassmusic",
      asset:"Studio BTS — DAW open, late night energy", cta:"follow", priority:"med", artist:"kotrax" },
    { id:"kt008", date:"2026-03-26", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"this one's been running for a minute ⚡ go save it if you haven't\n\n#kotrax #dubstep #bassmusic #dsr",
      asset:"Best performing DSR track clip or artwork animation", cta:"save", priority:"high", artist:"kotrax" },
    { id:"kt009", date:"2026-04-01", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"branding",
      caption:"live sets > everything ⚡\n\n#kotrax #liveshow #dubstep #bassmusic",
      asset:"Live set energy clip — crowd + drop moment", cta:"follow", priority:"med", artist:"kotrax" },
    { id:"kt010", date:"2026-04-07", time:"6:00 PM", platform:"IG / FB", postType:"Feed Post", category:"release",
      caption:"new music incoming ⚡\n\nfirst solo single of 2026. dates soon\n\n#kotrax #newmusic #dubstep #dsr",
      asset:"Teaser graphic — dark, energetic, minimal text", cta:"follow", priority:"high", artist:"kotrax" },
    { id:"kt011", date:"2026-04-14", time:"9:00 PM", platform:"IG Stories", postType:"Story", category:"release",
      caption:"dropping a single soon ⚡ stay ready\n[Countdown sticker to release date]",
      asset:"Release countdown story", cta:"follow", priority:"high", artist:"kotrax" },
    { id:"kt012", date:"2026-04-21", time:"7:00 PM", platform:"TikTok / IG Reels", postType:"Reel", category:"release",
      caption:"NEW MUSIC ⚡🔥 Kotrax on DSR — go stream it now\n\nlink in bio\n\n#kotrax #newmusic #dsr #dubstep #bassmusic",
      asset:"Single artwork animation or 15-sec audio clip with visualizer", cta:"stream", priority:"high", artist:"kotrax" },
  ],
};

// ─── CONTENT CALENDAR COMPONENT ────────────────────────────────────────────

const CATEGORY_CONFIG = {
  tour:     { label: "Tour",    color: "#f59e0b", icon: "🎤" },
  release:  { label: "Release", color: "#00ff88", icon: "🎵" },
  branding: { label: "Brand",   color: "#60a5fa", icon: "✦"  },
};

const PLATFORM_COLORS = {
  "IG / FB":            "#e1306c",
  "IG / FB / X":        "#e1306c",
  "IG":                 "#e1306c",
  "IG Stories":         "#e1306c",
  "IG Reels / TikTok":  "#00f2ea",
  "IG Reels / TikTok / YouTube": "#00f2ea",
  "TikTok":             "#00f2ea",
  "TikTok / IG Reels":  "#00f2ea",
  "X / Twitter":        "#1d9bf0",
  "YouTube":            "#ff0000",
};

function getWeekLabel(dateStr) {
  const d = new Date(dateStr);
  const opts = { month: "short", day: "numeric" };
  return d.toLocaleDateString("en-US", opts);
}

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d); monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (x) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function groupByWeek(posts) {
  const weeks = {};
  posts.forEach(p => {
    const d = new Date(p.date);
    const day = d.getDay();
    const monday = new Date(d); monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const key = monday.toISOString().split("T")[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(p);
  });
  return weeks;
}

function PostCard({ post, color, onApprove, onReject, approvedIds, rejectedIds }) {
  const cat = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.branding;
  const platColor = PLATFORM_COLORS[post.platform] || "#aaa";
  const isApproved = approvedIds.has(post.id);
  const isRejected = rejectedIds.has(post.id);

  return (
    <div className="rounded-xl p-3 mb-2" style={{
      background: isApproved ? "rgba(0,255,136,0.05)" : isRejected ? "rgba(255,80,80,0.05)" : "rgba(255,255,255,0.03)",
      border: isApproved ? "1px solid rgba(0,255,136,0.2)" : isRejected ? "1px solid rgba(255,80,80,0.15)" : "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* Top row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${cat.color}20`, color: cat.color }}>
          {cat.icon} {cat.label}
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${platColor}18`, color: platColor }}>
          {post.platform}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
          {post.postType}
        </span>
        <span className="text-xs ml-auto font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
          🕐 {post.time}
        </span>
      </div>

      {/* Caption */}
      <div className="text-xs mb-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontStyle: "italic", whiteSpace: "pre-line" }}>
        "{post.caption.length > 160 ? post.caption.slice(0, 160) + "…" : post.caption}"
      </div>

      {/* Asset needed */}
      <div className="flex items-start gap-1.5 mb-2">
        <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>📎</span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{post.asset}</span>
      </div>

      {/* TikTok SEO title */}
      {post.tiktokTitle && (
        <div className="flex items-start gap-1.5 mb-2 rounded-lg px-2 py-1.5" style={{ background: "rgba(0,242,234,0.06)", border: "1px solid rgba(0,242,234,0.15)" }}>
          <span className="text-xs mt-0.5">🔍</span>
          <div>
            <div className="text-xs font-bold mb-0.5" style={{ color: "#00f2ea" }}>TikTok SEO Title</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{post.tiktokTitle}</div>
          </div>
        </div>
      )}

      {/* Algorithm note */}
      {post.algorithmNote && (
        <div className="flex items-start gap-1.5 mb-2 rounded-lg px-2 py-1.5" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.15)" }}>
          <span className="text-xs mt-0.5">⚡</span>
          <div>
            <div className="text-xs font-bold mb-0.5" style={{ color: "#facc15" }}>Algorithm Hack</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{post.algorithmNote}</div>
          </div>
        </div>
      )}

      {/* Engagement window */}
      {post.engagementWindow && (
        <div className="flex items-start gap-1.5 mb-2 rounded-lg px-2 py-1.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <span className="text-xs mt-0.5">⏱</span>
          <div>
            <div className="text-xs font-bold mb-0.5" style={{ color: "#ef4444" }}>Engagement Window</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{post.engagementWindow}</div>
          </div>
        </div>
      )}

      {/* Hashtag set */}
      {post.hashtagSet && (
        <div className="flex items-start gap-1.5 mb-2">
          <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>#</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
            Hashtag Set {post.hashtagSet}
          </span>
        </div>
      )}

      {/* CTA + approve row */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
          CTA: {post.cta}
        </span>
        <div className="flex gap-1.5 ml-auto">
          {isApproved ? (
            <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}>✓ Approved</span>
          ) : isRejected ? (
            <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: "rgba(255,80,80,0.12)", color: "#ff5050" }}>✕ Rejected</span>
          ) : (
            <>
              <button onClick={() => onReject(post.id)} className="text-xs px-3 py-1 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(255,80,80,0.1)", color: "#ff5050", border: "1px solid rgba(255,80,80,0.2)" }}>
                ✕
              </button>
              <button onClick={() => onApprove(post.id)} className="text-xs px-3 py-1 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ background: `${color}15`, color: color, border: `1px solid ${color}35` }}>
                ✓ Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentCalendarView({ entity }) {
  const color = entity.color;
  const artistId = entity.id;
  const [filter, setFilter] = useState("all");
  const [approvedIds, setApprovedIds] = useState(new Set());
  const [rejectedIds, setRejectedIds] = useState(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const posts = CONTENT_CALENDAR[artistId] || [];
  const filtered = filter === "all" ? posts : posts.filter(p => p.category === filter);
  const byWeek = groupByWeek([...filtered].sort((a,b) => new Date(a.date) - new Date(b.date)));
  const weekKeys = Object.keys(byWeek).sort();

  const approveAll = (weekKey) => {
    const ids = byWeek[weekKey].map(p => p.id);
    setApprovedIds(prev => { const s = new Set(prev); ids.forEach(id => s.add(id)); return s; });
  };

  const toggleWeek = (k) => setExpandedWeeks(prev => ({ ...prev, [k]: !prev[k] }));

  const totalApproved = approvedIds.size;
  const totalPosts = posts.length;

  return (
    <div className="p-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Total Posts", val: totalPosts },
          { label: "Approved", val: totalApproved, color: "#00ff88" },
          { label: "Pending", val: totalPosts - totalApproved - rejectedIds.size, color: color },
        ].map((s,i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-lg font-bold" style={{ color: s.color || "white" }}>{s.val}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[["all","All","#fff"],["tour","Tour","#f59e0b"],["release","Release","#00ff88"],["branding","Brand","#60a5fa"]].map(([id,label,c]) => (
          <button key={id} onClick={() => setFilter(id)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            style={{
              background: filter === id ? `${c}20` : "rgba(255,255,255,0.05)",
              color: filter === id ? c : "rgba(255,255,255,0.4)",
              border: filter === id ? `1px solid ${c}40` : "1px solid transparent"
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Week groups */}
      {weekKeys.map(wk => {
        const weekPosts = byWeek[wk].sort((a,b) => new Date(a.date+' '+a.time) - new Date(b.date+' '+b.time));
        const isOpen = expandedWeeks[wk] !== false; // default open
        const weekApproved = weekPosts.filter(p => approvedIds.has(p.id)).length;
        return (
          <div key={wk} className="mb-4">
            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => toggleWeek(wk)}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color }}>{getWeekRange(wk)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                  {weekPosts.length} posts
                </span>
                {weekApproved > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88" }}>
                    {weekApproved} ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); approveAll(wk); }}
                  className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
                  Approve All
                </button>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>
            {isOpen && weekPosts.map(post => (
              <PostCard key={post.id} post={post} color={color}
                approvedIds={approvedIds} rejectedIds={rejectedIds}
                onApprove={(id) => setApprovedIds(prev => { const s = new Set(prev); s.add(id); return s; })}
                onReject={(id) => setRejectedIds(prev => { const s = new Set(prev); s.add(id); return s; })} />
            ))}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.25)" }}>
          <div className="text-3xl mb-2">📅</div>
          <div className="text-sm">No posts in this category</div>
        </div>
      )}
    </div>
  );
}

// ─── MASTER CALENDAR (Manager view — all artists) ─────────────────────────

const ARTIST_META = {
  dirtysnatcha: { name: "DirtySnatcha", color: "#00ff88", emoji: "🛸" },
  whoisee:      { name: "WHOiSEE",      color: "#a855f7", emoji: "👁️" },
  darkmatter:   { name: "Dark Matter",  color: "#06b6d4", emoji: "🌌" },
  kotrax:       { name: "Kotrax",       color: "#f97316", emoji: "⚡" },
};

function MasterCalendarView() {
  const [filter, setFilter] = useState("all");
  const [artistFilter, setArtistFilter] = useState("all");
  const [approvedIds, setApprovedIds] = useState(new Set());
  const [rejectedIds, setRejectedIds] = useState(new Set());

  const allPosts = Object.values(CONTENT_CALENDAR).flat();
  let filtered = allPosts;
  if (filter !== "all") filtered = filtered.filter(p => p.category === filter);
  if (artistFilter !== "all") filtered = filtered.filter(p => p.artist === artistFilter);
  filtered = filtered.sort((a,b) => new Date(a.date+"T"+a.time.replace(" ","")) - new Date(b.date+"T"+b.time.replace(" ","")));

  const byWeek = groupByWeek(filtered);
  const weekKeys = Object.keys(byWeek).sort();

  const totalApproved = approvedIds.size;
  const totalPending = allPosts.length - approvedIds.size - rejectedIds.size;

  return (
    <div className="p-4">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "All Posts", val: allPosts.length, color: "#f59e0b" },
          { label: "Approved",  val: totalApproved,   color: "#00ff88" },
          { label: "Pending",   val: totalPending,    color: "#60a5fa" },
          { label: "Rejected",  val: rejectedIds.size,color: "#ff5050" },
        ].map((s,i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Artist filter */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <button onClick={() => setArtistFilter("all")}
          className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: artistFilter==="all" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)", color: artistFilter==="all" ? "#fff" : "rgba(255,255,255,0.35)", border: "1px solid transparent" }}>
          All Artists
        </button>
        {Object.entries(ARTIST_META).map(([id, a]) => (
          <button key={id} onClick={() => setArtistFilter(id)}
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: artistFilter===id ? `${a.color}20` : "rgba(255,255,255,0.05)", color: artistFilter===id ? a.color : "rgba(255,255,255,0.35)", border: artistFilter===id ? `1px solid ${a.color}35` : "1px solid transparent" }}>
            {a.emoji} {a.name}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[["all","All"],["tour","🎤 Tour"],["release","🎵 Release"],["branding","✦ Brand"]].map(([id,label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: filter===id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", color: filter===id ? "#fff" : "rgba(255,255,255,0.35)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Weekly timeline */}
      {weekKeys.map(wk => {
        const weekPosts = byWeek[wk];
        const wkApproved = weekPosts.filter(p => approvedIds.has(p.id)).length;
        return (
          <div key={wk} className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>{getWeekRange(wk)}</span>
              <div className="flex items-center gap-2">
                {wkApproved > 0 && <span className="text-xs" style={{ color: "#00ff88" }}>{wkApproved} approved</span>}
                <button onClick={() => {
                  const ids = weekPosts.map(p => p.id);
                  setApprovedIds(prev => { const s = new Set(prev); ids.forEach(id => s.add(id)); return s; });
                }} className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "rgba(0,255,136,0.08)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)" }}>
                  Approve All
                </button>
              </div>
            </div>
            {weekPosts.map(post => {
              const a = ARTIST_META[post.artist] || {};
              const cat = CATEGORY_CONFIG[post.category] || {};
              const platColor = PLATFORM_COLORS[post.platform] || "#aaa";
              const isApproved = approvedIds.has(post.id);
              const isRejected = rejectedIds.has(post.id);
              return (
                <div key={post.id} className="rounded-xl p-3 mb-2" style={{
                  background: isApproved ? "rgba(0,255,136,0.04)" : isRejected ? "rgba(255,80,80,0.04)" : "rgba(255,255,255,0.02)",
                  border: isApproved ? "1px solid rgba(0,255,136,0.15)" : isRejected ? "1px solid rgba(255,80,80,0.12)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {/* Artist badge */}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${a.color}18`, color: a.color }}>
                      {a.emoji} {a.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cat.color}15`, color: cat.color }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${platColor}15`, color: platColor }}>
                      {post.platform}
                    </span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {getWeekLabel(post.date)} · {post.time}
                    </span>
                    <div className="ml-auto flex gap-1.5">
                      {isApproved ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color: "#00ff88" }}>✓ Approved</span>
                      ) : isRejected ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color: "#ff5050" }}>✕ Rejected</span>
                      ) : (
                        <>
                          <button onClick={() => setRejectedIds(prev => { const s = new Set(prev); s.add(post.id); return s; })}
                            className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,80,80,0.1)", color: "#ff5050" }}>✕</button>
                          <button onClick={() => setApprovedIds(prev => { const s = new Set(prev); s.add(post.id); return s; })}
                            className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88" }}>✓</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                    "{post.caption.length > 120 ? post.caption.slice(0,120)+"…" : post.caption}"
                  </div>
                  <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    📎 {post.asset.length > 80 ? post.asset.slice(0,80)+"…" : post.asset}
                  </div>
                  {post.algorithmNote && (
                    <div className="text-xs mt-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(250,204,21,0.07)", color: "#facc15" }}>
                      ⚡ {post.algorithmNote.length > 100 ? post.algorithmNote.slice(0,100)+"…" : post.algorithmNote}
                    </div>
                  )}
                  {post.tiktokTitle && (
                    <div className="text-xs mt-1 px-2 py-1 rounded-lg" style={{ background: "rgba(0,242,234,0.06)", color: "#00f2ea" }}>
                      🔍 TikTok title: {post.tiktokTitle}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DashboardView({ entity, onBack }) {
  const [tab, setTab] = useState("overview");
  const color = entity.color;
  const hasCatalog = ["dirtysnatcha", "whoisee", "manager"].includes(entity.id);
  const hasCalendar = ["dirtysnatcha", "whoisee", "darkmatter", "kotrax", "manager"].includes(entity.id);

  const tabs = [
    { id: "overview",  label: "Overview",  icon: "📊" },
    ...(hasCatalog   ? [{ id: "catalog",  label: "Catalog",  icon: "💿" }] : []),
    ...(hasCalendar  ? [{ id: "calendar", label: "Content",  icon: "📅" }] : []),
    { id: "chat",    label: "Chat",     icon: "⚡" },
  ];

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={onBack} className="text-sm px-3 py-1 rounded-lg"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
          ←
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
            {entity.emoji}
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color }}>{entity.name}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{entity.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00ff88" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Live</span>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex px-4 py-2 gap-1 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === t.id ? `${color}18` : "transparent",
              color: tab === t.id ? color : "rgba(255,255,255,0.4)",
              border: tab === t.id ? `1px solid ${color}30` : "1px solid transparent"
            }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "overview"  && <OverviewView entity={entity} />}
        {tab === "catalog"   && <CatalogView entity={entity} />}
        {tab === "calendar"  && (entity.id === "manager" ? <MasterCalendarView /> : <ContentCalendarView entity={entity} />)}
        {tab === "chat"      && <ChatTab entity={entity} />}
      </div>
    </div>
  );
}

// ─── PASSCODE MODAL ───────────────────────────────────────────────────────────

function PasscodeModal({ entity, onSuccess, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const check = () => {
    if (code.toUpperCase() === entity.passcode) { onSuccess(); }
    else { setError(true); setCode(""); setTimeout(() => setError(false), 1000); }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}>
      <div className="rounded-2xl p-6 w-full max-w-sm"
        style={{ background: "#111118", border: `1px solid ${entity.color}33` }}>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{entity.emoji}</div>
          <div className="text-base font-bold text-white mb-1">{entity.name}</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Enter access code</div>
        </div>
        <input ref={inputRef} type="password" value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && check()}
          placeholder="••••••"
          className="w-full text-center text-xl tracking-widest rounded-xl px-4 py-3 outline-none mb-4"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${error ? "#ef4444" : entity.color + "44"}`,
            color: error ? "#ef4444" : "white",
            letterSpacing: "0.4em",
            transition: "border-color 0.2s"
          }} />
        {error && <p className="text-center text-xs text-red-400 mb-3">Incorrect. Try again.</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>
            Cancel
          </button>
          <button onClick={check} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: entity.color, color: "#000" }}>
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ARTIST CARD ──────────────────────────────────────────────────────────────

function ArtistCard({ entity, onSelect }) {
  const color = entity.color;
  return (
    <button onClick={() => onSelect(entity)}
      className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.015] active:scale-[0.98]"
      style={{ background: "rgba(255,255,255,0.035)", border: `1px solid ${color}28` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          {entity.emoji}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{entity.name}</div>
          <div className="text-xs" style={{ color }}>{entity.label}</div>
        </div>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
        {entity.tagline}
      </p>
      {entity.profile && (
        <div className="flex flex-wrap gap-1.5">
          {entity.profile.genre && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${color}15`, color }}>
              {entity.profile.genre.split(" / ")[0]}
            </span>
          )}
          {entity.profile.location && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
              {entity.profile.location}
            </span>
          )}
          {entity.profile.active_release && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: color + "18", color }}>
              🎵 {entity.profile.active_release.split("(")[0].trim()}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Tap to enter</span>
        <span style={{ color }}>→</span>
      </div>
    </button>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [selected, setSelected] = useState(null);
  const [authenticated, setAuthenticated] = useState(null);
  const [showPasscode, setShowPasscode] = useState(false);

  const handleSelect = (entity) => { setSelected(entity); setShowPasscode(true); };
  const handleAuth = () => { setShowPasscode(false); setAuthenticated(selected); };
  const handleBack = () => { setAuthenticated(null); setSelected(null); };

  if (authenticated) {
    return <DashboardView entity={authenticated} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00ff88" }} />
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            TENx10 Platform
          </span>
        </div>
        <h1 className="text-4xl font-black text-white mb-1.5 tracking-tighter">
          TEN<span style={{ color: "#00ff88" }}>x10</span>
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          Select your profile
        </p>
      </div>

      {/* Manager Card */}
      <div className="px-4 mb-3">
        <button onClick={() => handleSelect(MANAGER)}
          className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.06))",
            border: "1px solid rgba(245,158,11,0.28)"
          }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.3)" }}>
                ⚡
              </div>
              <div>
                <div className="font-bold text-white text-sm">Manager Dashboard</div>
                <div className="text-xs" style={{ color: "rgba(245,158,11,0.75)" }}>
                  Thomas Nalian · 4 Artists · DSR Label
                </div>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: "rgba(245,158,11,0.18)", color: "#f59e0b" }}>
              Admin
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 my-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Artists</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      <div className="px-4 flex flex-col gap-3 pb-10">
        {Object.values(ARTISTS).map(artist => (
          <ArtistCard key={artist.id} entity={artist} onSelect={handleSelect} />
        ))}
      </div>

      <div className="text-center pb-8">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }}>
          TENx10 · v0.2 · March 2026
        </p>
      </div>

      {showPasscode && selected && (
        <PasscodeModal
          entity={selected}
          onSuccess={handleAuth}
          onCancel={() => { setShowPasscode(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
