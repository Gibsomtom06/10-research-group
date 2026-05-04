import { useState, useEffect, useMemo } from "react";

const SHOWS = [
  { id: 1, date: "2026-02-27", city: "Lincoln", state: "NE", venue: "Royal Grove", offer: 2000, deal: "OFFER", support: "WHOiSEE, Dark Matter", phase: "COMPLETED", venueConfirmed: true, contractSigned: false, depositReceived: true, ticketLink: false, pixelInstalled: false, adsLive: false },
  { id: 2, date: "2026-03-06", city: "Albuquerque", state: "NM", venue: "Effex", offer: 2000, deal: "OFFER", support: "Mport, Kotrax, HVRCRFT", phase: "FINAL PUSH", venueConfirmed: true, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false, sellout: "Med-High", adBudget: "$75-125" },
  { id: 3, date: "2026-03-13", city: "Tampa", state: "FL", venue: "TBD", offer: 2000, deal: "OFFER", support: "Kotrax, Mport, HVRCRFT", phase: "FINAL PUSH", venueConfirmed: true, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false, sellout: "Med-High", adBudget: "$150-250" },
  { id: 4, date: "2026-03-14", city: "Pittsburgh", state: "PA", venue: "SideQuest", offer: 2500, deal: "CONTRACT", support: "WHOiSEE, Dark Matter", phase: "FINAL PUSH", venueConfirmed: true, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false, sellout: "High", adBudget: "$100-150" },
  { id: 5, date: "2026-03-27", city: "Louisville", state: "KY", venue: "TBD", offer: 1250, deal: "CONTRACT", support: "TBD", phase: "MAINTENANCE", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false },
  { id: 6, date: "2026-03-28", city: "Covington", state: "KY", venue: "TBD", offer: 1250, deal: "CONTRACT", support: "TBD", phase: "MAINTENANCE", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false },
  { id: 7, date: "2026-04-03", city: "Las Vegas", state: "NV", venue: "Ravehouse", offer: 2000, deal: "CONTRACT", support: "HVRCRFT, Mport", phase: "ON-SALE", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false, sellout: "Med-High", adBudget: "$100-200" },
  { id: 8, date: "2026-04-09", city: "Denver", state: "CO", venue: "Larimer Lounge", offer: 1500, deal: "CONTRACT", support: "Kotrax, Ozztin", phase: "ON-SALE", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false, sellout: "VERY HIGH", adBudget: "$0-100" },
  { id: 9, date: "2026-04-11", city: "Rochester", state: "NY", venue: "TBD", offer: 2000, deal: "CONTRACT", support: "TBD", phase: "ON-SALE", venueConfirmed: true, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false },
  { id: 10, date: "2026-04-18", city: "Tucson", state: "AZ", venue: "TBD", offer: 1600, deal: "CONTRACT", support: "TBD", phase: "ON-SALE", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false },
  { id: 11, date: "2026-04-24", city: "Asbury Park", state: "NJ", venue: "House of Independents", offer: 2500, deal: "OFFER", support: "WHOiSEE, Dark Matter", phase: "ANNOUNCEMENT", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false, sellout: "Med-High", adBudget: "$100-150" },
  { id: 12, date: "2026-04-25", city: "Hartford", state: "CT", venue: "Webster Theater", offer: 2500, deal: "OFFER", support: "Dark Matter, HVRCRFT", phase: "ANNOUNCEMENT", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false, sellout: "Med-High", adBudget: "$150" },
  { id: 13, date: "2026-05-02", city: "Butte", state: "MT", venue: "Covellite Theatre", offer: 5000, deal: "CONTRACT", support: "Kotrax, Ozztin, HVRCRFT", phase: "ANNOUNCEMENT", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false, sellout: "High", adBudget: "$50-100" },
  { id: 14, date: "2026-05-15", city: "Oklahoma City", state: "OK", venue: "Bamboo Lounge", offer: 2000, deal: "CONTRACT", support: "TBD", phase: "ANNOUNCEMENT", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false },
  { id: 15, date: "2026-05-16", city: "Dallas", state: "TX", venue: "TBD", offer: 2000, deal: "CONTRACT", support: "Infected Mushroom support", phase: "ANNOUNCEMENT", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false },
  { id: 16, date: "2026-05-22", city: "Houston", state: "TX", venue: "TBD", offer: 2000, deal: "CONTRACT", support: "Infected Mushroom support", phase: "ANNOUNCEMENT", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false },
  { id: 17, date: "2026-06-20", city: "San Diego", state: "CA", venue: "TBD", offer: 3000, deal: "CONTRACT", support: "TBD", phase: "ANNOUNCEMENT", venueConfirmed: false, contractSigned: false, depositReceived: false, ticketLink: false, pixelInstalled: false, adsLive: false },
];

const RELEASES = [
  { id: 1, title: "Drugs In The Club", artist: "DirtySnatcha", type: "Single", date: "2026-02-27", status: "RELEASED", editorial: false, notes: "Dropped same day as Lincoln show" },
];

const CONTENT_TYPES = [
  { type: "SHOW_ANNOUNCE", label: "Show Announcement", platforms: ["IG", "TT", "FB"], frequency: "Per show, 60+ days out" },
  { type: "COUNTDOWN", label: "Countdown Post", platforms: ["IG Stories", "TT"], frequency: "10 days out, daily" },
  { type: "BTS_STUDIO", label: "Studio / BTS Clip", platforms: ["IG Reels", "TT", "YT Shorts"], frequency: "2x/week" },
  { type: "LIVE_RECAP", label: "Live Show Recap", platforms: ["IG Reels", "TT", "YT Shorts"], frequency: "Day after show" },
  { type: "MEME_HUMOR", label: "Alien Humor / Meme", platforms: ["IG", "TT", "Twitter"], frequency: "3x/week" },
  { type: "RELEASE_TEASER", label: "Release Teaser", platforms: ["IG Reels", "TT", "YT Shorts"], frequency: "T-14 to release" },
  { type: "RELEASE_DROP", label: "Release Day Post", platforms: ["All"], frequency: "Release day" },
  { type: "FAN_REPOST", label: "Fan Content Repost", platforms: ["IG Stories", "TT"], frequency: "Ongoing" },
  { type: "BRAND_CATCH", label: "PLAY SOME F*CKING DUBSTEP", platforms: ["IG", "TT"], frequency: "1x/week" },
  { type: "COLLAB_PUSH", label: "Collab / Feature Push", platforms: ["IG", "TT"], frequency: "Per release" },
];

const TODAY = new Date("2026-03-01");

function daysOut(dateStr) {
  const d = new Date(dateStr);
  const diff = Math.ceil((d - TODAY) / (1000 * 60 * 60 * 24));
  return diff;
}

function phaseColor(phase) {
  const colors = {
    "COMPLETED": "#4a5568",
    "FINAL PUSH": "#ef4444",
    "MAINTENANCE": "#f59e0b",
    "ON-SALE": "#22d3ee",
    "ANNOUNCEMENT": "#a855f7",
  };
  return colors[phase] || "#6b7280";
}

function phaseBg(phase) {
  const colors = {
    "COMPLETED": "rgba(74,85,104,0.15)",
    "FINAL PUSH": "rgba(239,68,68,0.12)",
    "MAINTENANCE": "rgba(245,158,11,0.12)",
    "ON-SALE": "rgba(34,211,238,0.12)",
    "ANNOUNCEMENT": "rgba(168,85,247,0.12)",
  };
  return colors[phase] || "rgba(107,114,128,0.1)";
}

const CheckIcon = ({ checked }) => (
  <span style={{ color: checked ? "#22c55e" : "#ef4444", fontSize: 14, fontWeight: 700 }}>
    {checked ? "✓" : "✗"}
  </span>
);

function ShowRow({ show, isExpanded, onToggle }) {
  const days = daysOut(show.date);
  const dateObj = new Date(show.date);
  const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "short" });

  const rolloutItems = [
    { label: "Venue", ok: show.venueConfirmed },
    { label: "Contract", ok: show.contractSigned },
    { label: "Deposit", ok: show.depositReceived },
    { label: "Tix Link", ok: show.ticketLink },
    { label: "Pixel", ok: show.pixelInstalled },
    { label: "Ads", ok: show.adsLive },
  ];

  const completedCount = rolloutItems.filter(i => i.ok).length;
  const rolloutPct = Math.round((completedCount / rolloutItems.length) * 100);

  return (
    <div style={{ marginBottom: 2 }}>
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "60px 54px 1fr 110px 70px 80px 60px",
          alignItems: "center",
          padding: "10px 12px",
          background: phaseBg(show.phase),
          borderLeft: `3px solid ${phaseColor(show.phase)}`,
          borderRadius: 4,
          cursor: "pointer",
          transition: "background 0.15s",
          gap: 8,
        }}
      >
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#94a3b8", letterSpacing: "-0.02em" }}>
          {dayOfWeek} {dateStr}
        </div>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: phaseColor(show.phase),
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {days <= 0 ? "DONE" : `${days}d`}
        </div>
        <div>
          <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>
            {show.city}, {show.state}
          </span>
          <span style={{ color: "#64748b", fontSize: 11, marginLeft: 8 }}>
            {show.venue}
          </span>
        </div>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          padding: "3px 8px",
          borderRadius: 3,
          background: phaseColor(show.phase),
          color: "#0f172a",
          textAlign: "center",
          letterSpacing: "0.04em",
        }}>
          {show.phase}
        </div>
        <div style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
          ${show.offer.toLocaleString()}
        </div>
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <div style={{
            width: 50,
            height: 5,
            background: "#1e293b",
            borderRadius: 3,
            overflow: "hidden",
          }}>
            <div style={{
              width: `${rolloutPct}%`,
              height: "100%",
              background: rolloutPct === 100 ? "#22c55e" : rolloutPct > 0 ? "#f59e0b" : "#ef4444",
              borderRadius: 3,
              transition: "width 0.3s",
            }} />
          </div>
          <span style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{rolloutPct}%</span>
        </div>
        <div style={{ color: "#475569", fontSize: 12, textAlign: "right" }}>
          {isExpanded ? "▲" : "▼"}
        </div>
      </div>

      {isExpanded && (
        <div style={{
          padding: "12px 16px",
          background: "#0c1222",
          borderLeft: `3px solid ${phaseColor(show.phase)}`,
          borderRadius: "0 0 4px 4px",
          marginTop: -1,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.08em" }}>Rollout Checklist</div>
              {rolloutItems.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <CheckIcon checked={item.ok} />
                  <span style={{ fontSize: 11, color: item.ok ? "#94a3b8" : "#f87171" }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.08em" }}>Support</div>
              <div style={{ fontSize: 12, color: "#cbd5e1" }}>{show.support}</div>
              {show.sellout && (
                <>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginBottom: 4, marginTop: 8, letterSpacing: "0.08em" }}>Sellout Probability</div>
                  <div style={{ fontSize: 12, color: show.sellout.includes("VERY") ? "#22c55e" : show.sellout.includes("High") ? "#22d3ee" : "#f59e0b", fontWeight: 600 }}>{show.sellout}</div>
                </>
              )}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.08em" }}>Deal</div>
              <div style={{ fontSize: 12, color: "#cbd5e1" }}>{show.deal}</div>
              {show.adBudget && (
                <>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginBottom: 4, marginTop: 8, letterSpacing: "0.08em" }}>Rec. Ad Spend</div>
                  <div style={{ fontSize: 12, color: "#a855f7", fontWeight: 600 }}>{show.adBudget}</div>
                </>
              )}
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginBottom: 4, marginTop: 8, letterSpacing: "0.08em" }}>Commission</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Agent: ${Math.round(show.offer * 0.1)} · Mgmt: ${Math.round(show.offer * 0.1)} · Artist: ${Math.round(show.offer * 0.8)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DSRCommandCenter() {
  const [activeTab, setActiveTab] = useState("tour");
  const [expandedShow, setExpandedShow] = useState(null);
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [contentWeek, setContentWeek] = useState(0);

  const phases = ["ALL", "FINAL PUSH", "MAINTENANCE", "ON-SALE", "ANNOUNCEMENT", "COMPLETED"];

  const filteredShows = useMemo(() => {
    if (phaseFilter === "ALL") return SHOWS;
    return SHOWS.filter(s => s.phase === phaseFilter);
  }, [phaseFilter]);

  const tourStats = useMemo(() => {
    const active = SHOWS.filter(s => s.phase !== "COMPLETED");
    const totalGuaranteed = SHOWS.reduce((a, s) => a + s.offer, 0);
    const noContract = active.filter(s => !s.contractSigned).length;
    const noDeposit = active.filter(s => !s.depositReceived).length;
    const noAds = active.filter(s => !s.adsLive).length;
    const next3 = SHOWS.filter(s => s.phase !== "COMPLETED").slice(0, 3);
    return { active: active.length, totalGuaranteed, noContract, noDeposit, noAds, next3 };
  }, []);

  const generateWeekContent = (weekOffset) => {
    const weekStart = new Date(TODAY);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    const showsThisWeek = SHOWS.filter(s => {
      const d = new Date(s.date);
      return d >= weekStart && d <= weekEnd;
    });

    const showsNext2Weeks = SHOWS.filter(s => {
      const d = new Date(s.date);
      const twoWeeksOut = new Date(weekEnd);
      twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
      return d > weekEnd && d <= twoWeeksOut && s.phase !== "COMPLETED";
    });

    const posts = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    showsThisWeek.forEach(show => {
      posts.push({ day: "Day Of", type: "LIVE_RECAP", text: `${show.city} RECAP 🔥 Show night content`, platforms: "IG Reels, TT, YT Shorts", priority: "HIGH", showId: show.id });
    });

    showsNext2Weeks.forEach(show => {
      const d = daysOut(show.date) - weekOffset * 7;
      if (d <= 14 && d > 7) {
        posts.push({ day: days[1], type: "COUNTDOWN", text: `${show.city} countdown — ${d} days`, platforms: "IG Story, TT", priority: "MED", showId: show.id });
      }
      if (d <= 7) {
        posts.push({ day: days[0], type: "SHOW_ANNOUNCE", text: `THIS WEEK: ${show.city} final push`, platforms: "IG, TT, FB", priority: "HIGH", showId: show.id });
        posts.push({ day: days[3], type: "COUNTDOWN", text: `${show.city} — ${d} days left 👽`, platforms: "IG Story, TT", priority: "HIGH", showId: show.id });
      }
    });

    posts.push({ day: days[0], type: "BTS_STUDIO", text: "Studio session clip / production BTS", platforms: "IG Reels, TT", priority: "MED" });
    posts.push({ day: days[2], type: "MEME_HUMOR", text: "Alien humor post / bass meme", platforms: "IG, TT, Twitter", priority: "LOW" });
    posts.push({ day: days[4], type: "BRAND_CATCH", text: "PLAY SOME F*CKING DUBSTEP 🔥", platforms: "IG, TT", priority: "MED" });
    posts.push({ day: days[5], type: "FAN_REPOST", text: "Fan content repost / community love", platforms: "IG Stories", priority: "LOW" });

    if (weekOffset === 0) {
      posts.push({ day: days[1], type: "RELEASE_TEASER", text: "Drugs In The Club — streaming push / save CTA", platforms: "IG Story, TT", priority: "HIGH" });
    }

    return { weekLabel, posts: posts.sort((a, b) => {
      const dayOrder = { "Day Of": 8, ...Object.fromEntries(days.map((d, i) => [d, i])) };
      return (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
    })};
  };

  const weekContent = useMemo(() => generateWeekContent(contentWeek), [contentWeek]);

  const priorityColor = (p) => p === "HIGH" ? "#ef4444" : p === "MED" ? "#f59e0b" : "#64748b";
  const typeIcon = (t) => {
    const icons = {
      SHOW_ANNOUNCE: "📢", COUNTDOWN: "⏳", BTS_STUDIO: "🎛️", LIVE_RECAP: "🔥",
      MEME_HUMOR: "👽", RELEASE_TEASER: "🎵", RELEASE_DROP: "💥", FAN_REPOST: "🤝",
      BRAND_CATCH: "‼️", COLLAB_PUSH: "🤘",
    };
    return icons[t] || "📝";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080e1a",
      color: "#e2e8f0",
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a0a2e 50%, #0f172a 100%)",
        borderBottom: "1px solid #1e293b",
        padding: "16px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 900,
              background: "linear-gradient(135deg, #a855f7, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}>
              DSR COMMAND CENTER
            </h1>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              DirtySnatcha Records · Take Me To Your Leader 2026 · {TODAY.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tour Revenue</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#22c55e" }}>
                ${tourStats.totalGuaranteed.toLocaleString()}
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: "#1e293b" }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Active Shows</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#22d3ee" }}>
                {tourStats.active}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT BAR */}
      <div style={{
        background: "rgba(239,68,68,0.08)",
        borderBottom: "1px solid rgba(239,68,68,0.2)",
        padding: "8px 24px",
        display: "flex",
        gap: 20,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <span style={{ color: "#ef4444" }}>⚠ {tourStats.noContract} unsigned contracts</span>
        <span style={{ color: "#f59e0b" }}>⚠ {tourStats.noDeposit} missing deposits</span>
        <span style={{ color: "#ef4444" }}>⚠ {tourStats.noAds} shows with no ads live</span>
        <span style={{ color: "#64748b", marginLeft: "auto" }}>
          NEXT: {tourStats.next3.map(s => `${s.city} (${daysOut(s.date)}d)`).join(" → ")}
        </span>
      </div>

      {/* TABS */}
      <div style={{
        display: "flex",
        gap: 0,
        background: "#0c1222",
        borderBottom: "1px solid #1e293b",
      }}>
        {[
          { id: "tour", label: "🛸 Tour Grid", count: SHOWS.length },
          { id: "content", label: "📱 Content Calendar" },
          { id: "releases", label: "🎵 Releases" },
          { id: "rollout", label: "📋 Rollout Status" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              background: activeTab === tab.id ? "#1e293b" : "transparent",
              color: activeTab === tab.id ? "#e2e8f0" : "#64748b",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #a855f7" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: "0.02em",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
            {tab.count && <span style={{ marginLeft: 6, fontSize: 10, color: "#64748b" }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div style={{ padding: "16px 24px" }}>

        {/* TOUR TAB */}
        {activeTab === "tour" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {phases.map(p => (
                <button
                  key={p}
                  onClick={() => setPhaseFilter(p)}
                  style={{
                    padding: "4px 12px",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: phaseFilter === p ? phaseColor(p === "ALL" ? "ON-SALE" : p) : "#1e293b",
                    background: phaseFilter === p ? phaseColor(p === "ALL" ? "ON-SALE" : p) + "22" : "transparent",
                    color: phaseFilter === p ? phaseColor(p === "ALL" ? "ON-SALE" : p) : "#64748b",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {p} {p !== "ALL" && `(${SHOWS.filter(s => s.phase === p).length})`}
                </button>
              ))}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "60px 54px 1fr 110px 70px 80px 60px",
              padding: "6px 12px",
              fontSize: 9,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontFamily: "'JetBrains Mono', monospace",
              gap: 8,
            }}>
              <span>Date</span>
              <span>Days</span>
              <span>City / Venue</span>
              <span>Phase</span>
              <span>Offer</span>
              <span>Rollout</span>
              <span></span>
            </div>

            {filteredShows.map(show => (
              <ShowRow
                key={show.id}
                show={show}
                isExpanded={expandedShow === show.id}
                onToggle={() => setExpandedShow(expandedShow === show.id ? null : show.id)}
              />
            ))}
          </div>
        )}

        {/* CONTENT CALENDAR TAB */}
        {activeTab === "content" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                  Content Calendar
                </h2>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Auto-generated from tour phases + release schedule + brand cadence
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setContentWeek(Math.max(0, contentWeek - 1))}
                  style={{ padding: "6px 12px", background: "#1e293b", border: "none", borderRadius: 4, color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  ← Prev
                </button>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#a855f7", fontWeight: 600, minWidth: 120, textAlign: "center" }}>
                  {weekContent.weekLabel}
                </span>
                <button
                  onClick={() => setContentWeek(contentWeek + 1)}
                  style={{ padding: "6px 12px", background: "#1e293b", border: "none", borderRadius: 4, color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  Next →
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "60px 30px 1fr 140px 60px",
                padding: "6px 12px",
                fontSize: 9,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontFamily: "'JetBrains Mono', monospace",
                gap: 8,
              }}>
                <span>Day</span>
                <span></span>
                <span>Content</span>
                <span>Platforms</span>
                <span>Priority</span>
              </div>

              {weekContent.posts.map((post, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 30px 1fr 140px 60px",
                    padding: "10px 12px",
                    background: "#0f172a",
                    borderRadius: 4,
                    borderLeft: `3px solid ${priorityColor(post.priority)}`,
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#64748b" }}>{post.day}</span>
                  <span style={{ fontSize: 16 }}>{typeIcon(post.type)}</span>
                  <div>
                    <div style={{ fontSize: 12, color: "#e2e8f0" }}>{post.text}</div>
                    <div style={{ fontSize: 9, color: "#475569", marginTop: 2, textTransform: "uppercase" }}>{post.type.replace(/_/g, " ")}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{post.platforms}</span>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: priorityColor(post.priority),
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {post.priority}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: 16, background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b" }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: "#a855f7", marginBottom: 8 }}>
                📋 Content Types Reference
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {CONTENT_TYPES.map(ct => (
                  <div key={ct.type} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11 }}>
                    <span>{typeIcon(ct.type)}</span>
                    <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{ct.label}</span>
                    <span style={{ color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>{ct.frequency}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RELEASES TAB */}
        {activeTab === "releases" && (
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
              Release Pipeline
            </h2>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
              Current releases + scheduling framework. Build the cadence first, then slot the next single.
            </div>

            <div style={{ padding: 16, background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: "#22c55e" }}>
                  🟢 CURRENT RELEASE
                </h3>
                <span style={{ fontSize: 10, padding: "3px 10px", background: "#22c55e22", color: "#22c55e", borderRadius: 3, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>RELEASED 2/27</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Outfit', sans-serif" }}>
                Drugs In The Club
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>DirtySnatcha · Single · Released same day as Lincoln show</div>
              <div style={{ marginTop: 12, padding: 12, background: "#080e1a", borderRadius: 4, border: "1px dashed #1e293b" }}>
                <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>⚡ ACTION NEEDED</div>
                <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.6 }}>
                  Track current stream count, save-to-stream ratio, and playlist placements. This is the baseline for measuring everything going forward. Need Spotify Popularity Index and save rate to determine if Radio Priming or Shazam Spiking strategies are viable.
                </div>
              </div>
            </div>

            <div style={{ padding: 16, background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: "#a855f7", marginBottom: 12 }}>
                📐 RELEASE CADENCE FRAMEWORK
              </h3>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, lineHeight: 1.6 }}>
                Consistency Decay Rule: No new ISRC every 6-8 weeks = Artist Quality Score drops. DirtySnatcha needs a release every 6 weeks minimum to maintain algorithmic authority.
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  { week: "T-5 weeks", action: "Final master + metadata locked", detail: "ISRC assigned, BPM/key/mood tagged" },
                  { week: "T-4 weeks", action: "VMG upload + editorial pitch", detail: "S4A pitch 14+ days early, AM4A pitch with imagery + synced lyrics" },
                  { week: "T-3 weeks", action: "Pre-save campaign live", detail: "VMG Fan Engagement ads priming audience" },
                  { week: "T-2 weeks", action: "Teaser content begins", detail: "15-sec clips, TikTok preview, canvas uploaded" },
                  { week: "T-1 week", action: "Full push", detail: "Countdown posts, collab artist reshares, Pandora AAM" },
                  { week: "Release Day", action: "Drop + Stream Growth ads", detail: "VMG Stream Growth, all platforms, save CTA blitz" },
                  { week: "T+1 week", action: "Algorithmic monitoring", detail: "Check Popularity Index, save ratio, adjust Discovery Mode" },
                  { week: "T+2-4 weeks", action: "Sustain + waterfall prep", detail: "If EP planned, prep UPC with same ISRC for waterfall" },
                ].map((step, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: 12, padding: "8px 10px", background: "#080e1a", borderRadius: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#a855f7", fontWeight: 700 }}>{step.week}</span>
                    <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>{step.action}</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{step.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 16, background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b" }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: "#22d3ee", marginBottom: 12 }}>
                🎯 EDITORIAL PITCH CHECKLIST
              </h3>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>
                Requirements before pitching to any DSP editorial team:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  "High-res artwork (3000x3000 min)",
                  "Synced lyrics (Musixmatch)",
                  "Canvas / Clips uploaded (Spotify)",
                  "Artist bio updated on all DSPs",
                  "Pitch angle written (story, not description)",
                  "Similar artists tagged (Luci, Mersiv, Rezz)",
                  "BPM, key, mood metadata complete",
                  "ISRC registered + ISWC if cover",
                  "BMI/ASCAP registration confirmed",
                  "SoundExchange registration confirmed",
                  "Pandora AAM recorded",
                  "Amazon Alexa intro text written",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: "#475569", fontSize: 12 }}>○</span>
                    <span style={{ fontSize: 11, color: "#cbd5e1" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROLLOUT STATUS TAB */}
        {activeTab === "rollout" && (
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
              Tour Rollout Checklist
            </h2>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
              Every show needs ALL items green before Final Push phase. Red items = immediate action.
            </div>

            <div style={{ overflowX: "auto" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "140px repeat(6, 70px)",
                gap: 2,
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                <div style={{ padding: 8, color: "#475569" }}>Show</div>
                <div style={{ padding: 8, color: "#475569", textAlign: "center" }}>Venue</div>
                <div style={{ padding: 8, color: "#475569", textAlign: "center" }}>Contract</div>
                <div style={{ padding: 8, color: "#475569", textAlign: "center" }}>Deposit</div>
                <div style={{ padding: 8, color: "#475569", textAlign: "center" }}>Tix Link</div>
                <div style={{ padding: 8, color: "#475569", textAlign: "center" }}>Pixel</div>
                <div style={{ padding: 8, color: "#475569", textAlign: "center" }}>Ads</div>

                {SHOWS.filter(s => s.phase !== "COMPLETED").map(show => {
                  const days = daysOut(show.date);
                  const urgent = days <= 14;
                  return (
                    <React.Fragment key={show.id}>
                      <div style={{
                        padding: 8,
                        background: "#0f172a",
                        borderLeft: `3px solid ${phaseColor(show.phase)}`,
                        borderRadius: "4px 0 0 4px",
                      }}>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 11 }}>
                          {show.city}, {show.state}
                        </div>
                        <div style={{ color: phaseColor(show.phase), fontSize: 9, marginTop: 2 }}>
                          {days}d · {show.phase}
                        </div>
                      </div>
                      {[show.venueConfirmed, show.contractSigned, show.depositReceived, show.ticketLink, show.pixelInstalled, show.adsLive].map((ok, i) => (
                        <div key={i} style={{
                          padding: 8,
                          background: ok ? "rgba(34,197,94,0.08)" : urgent && !ok ? "rgba(239,68,68,0.12)" : "#0f172a",
                          textAlign: "center",
                          borderRadius: i === 5 ? "0 4px 4px 0" : 0,
                        }}>
                          <span style={{
                            fontSize: 14,
                            color: ok ? "#22c55e" : urgent ? "#ef4444" : "#334155",
                          }}>
                            {ok ? "✓" : urgent ? "✗" : "○"}
                          </span>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
