import { useState } from "react";

const ARTIST = {
  name: "DirtySnatcha",
  spotifyPopularity: 28,
  spotifyMonthlyListeners: 8500,
  spotifyFollowers: 4500,
  spotifyTotalStreams: "1M+",
  soundcloudFollowers: 6500,
  soundcloudLabelFollowers: 2500,
  instagramFollowers: 11000,
  beatportRanked: true,
};

const TRACK = {
  title: "Drugs In Da Club",
  releaseDate: "2026-02-27",
  daysSinceRelease: 2,
  type: "Single",
  isrc: "TBD",
  upc: "TBD",
};

const DSPS = [
  {
    id: "spotify",
    name: "Spotify",
    color: "#1DB954",
    artistScoreName: "Artist Popularity Index",
    artistScoreRange: "0–100",
    artistScoreCurrent: 28,
    artistScoreTarget: 40,
    artistScoreStatus: "LOW",
    artistScoreExplain: "Score of 28 is low for an artist with 1M+ total streams. This means new releases get tested on small groups (~100 listeners) instead of 1,000+. Active search (fans typing 'DirtySnatcha') is the #1 driver — you need Destination Artist status.",
    trackScoreName: "Track Popularity Index",
    trackScoreRange: "0–100",
    trackScoreCurrent: null,
    trackScoreTarget: 30,
    trackScoreStatus: "UNKNOWN",
    trackScoreExplain: "Needs ~30+ out of 100 to trigger algorithmic takeover (Discover Weekly, Release Radar). Driven by save-to-stream ratio (target >10%), skip rate before 30 seconds, and share rate.",
    keyMetric: "Save-to-Stream Ratio",
    keyMetricTarget: ">10%",
    keyMetricCurrent: "Unknown — check S4A",
    decayRule: "No new ISRC every 6-8 weeks = Artist Score decays",
    hacks: [
      {
        name: "Radio Priming",
        priority: "HIGH",
        description: "Run Meta conversion ads focused on SAVES (not streams). Goal: push save-to-stream ratio above 10% threshold. This triggers Discover Weekly and Release Radar placement.",
        steps: ["Create Meta ad campaign with Conversion objective", "Target: bass music fans, dubstep, riddim, festival attendees in tour markets", "CTA: 'Save to Spotify' using direct save link", "Budget: $50-100 over 7 days", "Track save count in S4A dashboard daily"],
        expectedImpact: "Can push Track Score from <20 to 30+ in 1-2 weeks",
        costEstimate: "$50-100"
      },
      {
        name: "Discovery Mode Activation",
        priority: "HIGH",
        description: "Enable Discovery Mode on 'Drugs In Da Club' in Spotify for Artists. Trades royalty rate (~30% less per stream) for algorithmic boost in autoplay and radio.",
        steps: ["Open Spotify for Artists → Music tab", "Find 'Drugs In Da Club'", "Toggle Discovery Mode ON", "Monitor for 7 days — check if algorithmic streams increase", "If save-to-stream ratio improves, keep on. If not, toggle off after 2 weeks."],
        expectedImpact: "2-3x increase in algorithmic impressions",
        costEstimate: "Free (royalty trade)"
      },
      {
        name: "Canvas + Clips Upload",
        priority: "MED",
        description: "Upload a looping Canvas video and Clips content. Canvas increases share rate by 145% and watch time signals engagement to the algorithm.",
        steps: ["Create 3-8 second looping video (alien theme, bass visuals, club imagery)", "Upload via Spotify for Artists → Canvas", "Create 30-60 second Clip with artist commentary", "Both signal engagement which feeds Track Quality Score"],
        expectedImpact: "Increases share rate, indirectly boosts Track Score",
        costEstimate: "Free"
      },
      {
        name: "Editorial Pitch (Next Release)",
        priority: "FUTURE",
        description: "For the NEXT single, pitch via S4A at least 14 days before release. 'Drugs In Da Club' is already out so can't pitch editorially, but the next release must be pitched.",
        steps: ["Lock next single at least 5 weeks before release", "Upload to VMG 4 weeks out", "Pitch via S4A 14+ days before release date", "Include: genre tags, mood, instruments, story angle, similar artists (Luci, Mersiv, Rezz)"],
        expectedImpact: "Editorial playlist = massive Track Score boost",
        costEstimate: "Free"
      }
    ],
    tools: ["Spotify for Artists (S4A)", "Discovery Mode", "Marquee", "Showcase", "Canvas", "Clips"],
  },
  {
    id: "apple",
    name: "Apple Music",
    color: "#FC3C44",
    artistScoreName: "Artist Authority Score",
    artistScoreRange: "Hidden",
    artistScoreCurrent: null,
    artistScoreTarget: null,
    artistScoreStatus: "HIDDEN",
    artistScoreExplain: "Apple doesn't expose any artist score. Authority is inferred from Library Add Velocity — how quickly fans add tracks to their library. This determines algorithmic playlist placement.",
    trackScoreName: "Library Add Velocity (LAV)",
    trackScoreRange: "Hidden",
    trackScoreCurrent: null,
    trackScoreTarget: null,
    trackScoreStatus: "HIDDEN",
    trackScoreExplain: "How fast fans add 'Drugs In Da Club' to their personal library in the first 48-72 hours. High LAV = Apple promotes in algorithmic playlists.",
    keyMetric: "Library Adds / First 72 Hours",
    keyMetricTarget: "Spike in first 3 days",
    keyMetricCurrent: "Unknown",
    decayRule: "Less aggressive than Spotify but still rewards consistency",
    hacks: [
      {
        name: "Shazam Spiking",
        priority: "HIGH",
        description: "Geo-target social ads to ONE mid-sized city to trigger a regional 'Trending on Shazam' alert. Apple owns Shazam — trending data feeds directly into Apple Music's algorithm.",
        steps: ["Pick a tour market city (Albuquerque is ideal — show in 5 days)", "Run Meta/TikTok ads with 15-sec audio clip in that ONE city", "Ad should tease the sound without full track — makes people Shazam it", "Concentrate $50-75 in one city over 3-4 days", "Monitor Shazam for Artists dashboard for trending alert"],
        expectedImpact: "Regional Shazam trending → Apple Music algorithmic boost",
        costEstimate: "$50-75 concentrated"
      },
      {
        name: "AM4A Editorial Pitch (Next Release)",
        priority: "FUTURE",
        description: "Apple Music for Artists editorial pitching favors high-res imagery and synced lyrics. For next release, submit with both.",
        steps: ["Ensure artwork is 3000x3000 minimum", "Sync lyrics via Musixmatch before release", "Pitch through AM4A with story angle", "Include tour dates as 'cultural moment' in pitch"],
        expectedImpact: "Apple editorial placement",
        costEstimate: "Free"
      },
      {
        name: "Artist Messages (Voice Notes)",
        priority: "MED",
        description: "Record voice notes via Apple Music for Artists. Push directly to followers' notifications for tour promos and release pushes.",
        steps: ["Open Apple Music for Artists", "Record 15-30 second voice message about the tour / new music", "Targets Apple Music followers directly", "Use DirtySnatcha voice — raw, hype, authentic"],
        expectedImpact: "Direct engagement with Apple audience",
        costEstimate: "Free"
      }
    ],
    tools: ["Apple Music for Artists (AM4A)", "Shazam for Artists", "Artist Messages"],
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    artistScoreName: "Channel Authority",
    artistScoreRange: "Hidden",
    artistScoreCurrent: null,
    artistScoreTarget: null,
    artistScoreStatus: "HIDDEN",
    artistScoreExplain: "YouTube weights Watch-History Affinity — do people who watch DirtySnatcha also watch other bass music content? High affinity = recommended alongside similar artists.",
    trackScoreName: "Watch-History Affinity Score",
    trackScoreRange: "Hidden",
    trackScoreCurrent: null,
    trackScoreTarget: null,
    trackScoreStatus: "HIDDEN",
    trackScoreExplain: "Based on whether viewers also consume similar content. High retention (>60% of video) + re-watches are strong signals.",
    keyMetric: "Average View Duration + Audio Re-use",
    keyMetricTarget: ">60% retention, high Shorts re-use",
    keyMetricCurrent: "Unknown",
    decayRule: "Consistent uploads maintain channel authority",
    hacks: [
      {
        name: "Shorts Pivot",
        priority: "HIGH",
        description: "Link ISRC to YouTube Shorts. When people use the audio in their own Shorts, it counts as a massive Track Quality vote. Audio Re-use is the #1 signal.",
        steps: ["Upload 'Drugs In Da Club' audio to YouTube via official channel", "Create 3-5 Shorts using the track audio (live clips, bass drops, alien theme)", "Make audio easily findable — use track title in Shorts description", "Encourage fans to create Shorts with the audio", "Monitor 'Audio re-use' metric in YouTube Studio"],
        expectedImpact: "High audio re-use = YouTube pushes track in recommendations",
        costEstimate: "Free"
      },
      {
        name: "OAC Unification",
        priority: "MED",
        description: "Ensure Official Artist Channel is unified — all DirtySnatcha content merged into one channel for combined authority.",
        steps: ["Check if DirtySnatcha has a Topic channel (auto-generated by YouTube Music)", "If separate from main channel, request OAC merge via YouTube for Artists", "Combines all streams/views into one authority score"],
        expectedImpact: "Unified channel authority boosts all content",
        costEstimate: "Free"
      },
      {
        name: "Community Posts",
        priority: "LOW",
        description: "Use YouTube Community tab for tour announcements and polls. Engagement signals active fanbase to the algorithm.",
        steps: ["Post tour dates, behind-the-scenes, polls", "Ask fans which city they're coming from", "Engagement feeds channel authority"],
        expectedImpact: "Indirect channel authority boost",
        costEstimate: "Free"
      }
    ],
    tools: ["YouTube Studio", "YouTube for Artists", "OAC", "Community Posts"],
  },
  {
    id: "pandora",
    name: "Pandora",
    color: "#3668FF",
    artistScoreName: "Artist Genome Weight",
    artistScoreRange: "Hidden",
    artistScoreCurrent: null,
    artistScoreTarget: null,
    artistScoreStatus: "HIDDEN",
    artistScoreExplain: "Pandora's Music Genome Project tags every track with 450+ attributes. Artist weight is determined by cumulative thumbs-up ratio across all tracks.",
    trackScoreName: "Thumbs Up/Down Ratio",
    trackScoreRange: "Hidden — extremely ruthless",
    trackScoreCurrent: null,
    trackScoreTarget: null,
    trackScoreStatus: "HIDDEN",
    trackScoreExplain: "Pandora is binary: thumbs up boosts, thumbs down permanently deprioritizes. A few early thumbs down could shadow-ban the track from radio rotations forever.",
    keyMetric: "Thumbs Ratio",
    keyMetricTarget: ">80% thumbs up",
    keyMetricCurrent: "Unknown",
    decayRule: "Tracks with bad early thumbs ratio never recover",
    hacks: [
      {
        name: "Featured Tracks",
        priority: "HIGH",
        description: "Force-feed 'Drugs In Da Club' as Featured Track for up to 8 weeks. Pins it to your Pandora profile and forces algorithmic sampling.",
        steps: ["Open Pandora AMP (Artist Marketing Platform)", "Navigate to Featured Tracks", "Select 'Drugs In Da Club'", "Set as Featured Track (runs up to 8 weeks)", "Monitor thumbs ratio weekly"],
        expectedImpact: "8 weeks of forced algorithmic exposure",
        costEstimate: "Free"
      },
      {
        name: "Artist Audio Messages (AAM)",
        priority: "MED",
        description: "Record audio messages that play between songs on Pandora stations. Direct connection to listeners during lean-back sessions.",
        steps: ["Open Pandora AMP", "Record 15-30 sec audio message (tour promo, new track push)", "Use DirtySnatcha voice — match the brand tone", "Target listeners of similar artist stations (Luci, Mersiv, Excision)"],
        expectedImpact: "Direct ear-to-fan connection during passive listening",
        costEstimate: "Free"
      }
    ],
    tools: ["Pandora AMP", "Featured Tracks", "Artist Audio Messages (AAM)"],
  },
  {
    id: "amazon",
    name: "Amazon Music",
    color: "#25D1DA",
    artistScoreName: "Voice Request Index",
    artistScoreRange: "Hidden",
    artistScoreCurrent: null,
    artistScoreTarget: null,
    artistScoreStatus: "HIDDEN",
    artistScoreExplain: "Amazon is Alexa-driven. The algorithm heavily weights voice requests — how often people say 'Alexa, play DirtySnatcha'. Natural language matching is key.",
    trackScoreName: "Voice Request Frequency",
    trackScoreRange: "Hidden",
    trackScoreCurrent: null,
    trackScoreTarget: null,
    trackScoreStatus: "HIDDEN",
    trackScoreExplain: "If fans ask Alexa to play the track by name, it signals high intent. Amazon then boosts in algorithmic playlists and 'Recommended' sections.",
    keyMetric: "Alexa Voice Requests",
    keyMetricTarget: "Measurable voice request volume",
    keyMetricCurrent: "Unknown",
    decayRule: "Voice-driven — decays with disuse",
    hacks: [
      {
        name: "Natural Language Optimization",
        priority: "MED",
        description: "Ensure lyrics are in metadata so Alexa's conversational search can find the track when people describe it rather than name it.",
        steps: ["Confirm lyrics synced in Musixmatch", "Add descriptive keywords in VMG metadata: 'dubstep', 'bass drop', 'heavy bass'", "Write Alexa intro text: 'Hey Alexa, play Drugs In Da Club by DirtySnatcha'", "Include this CTA in social posts to train fans to voice-request"],
        expectedImpact: "Captures passive voice-search listeners",
        costEstimate: "Free"
      },
      {
        name: "Voice Intro Pitching",
        priority: "LOW",
        description: "Pitch for Spotlight placement on Amazon Music via VMG distributor submission.",
        steps: ["Contact VMG rep about Amazon Music Spotlight submission", "Include tour dates as cultural moment"],
        expectedImpact: "Amazon editorial visibility",
        costEstimate: "Free"
      }
    ],
    tools: ["Amazon Music for Artists", "VMG Distribution Portal", "Alexa Voice Intro"],
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    color: "#FF5500",
    artistScoreName: "Creator Score",
    artistScoreRange: "Hidden",
    artistScoreCurrent: null,
    artistScoreTarget: null,
    artistScoreStatus: "ESTIMATED",
    artistScoreExplain: "6,500 followers on artist profile + 2,500 on label = 9,000 combined. SoundCloud weights engagement-to-play ratio heavily. Comments and reposts matter more than raw plays.",
    trackScoreName: "Engagement-to-Play Ratio",
    trackScoreRange: "Hidden",
    trackScoreCurrent: null,
    trackScoreTarget: null,
    trackScoreStatus: "HIDDEN",
    trackScoreExplain: "SoundCloud's AI tests every track on ~100 listeners first. Their reaction (comments, likes, reposts, full listens) determines the viral cap.",
    keyMetric: "Comments + Reposts per 1K plays",
    keyMetricTarget: "High engagement in first 100 plays",
    keyMetricCurrent: "Check SoundCloud stats",
    decayRule: "Engagement-driven, rewards consistent uploading",
    hacks: [
      {
        name: "100-Listener Test Optimization",
        priority: "HIGH",
        description: "SoundCloud tests every new track on ~100 listeners. Front-load engagement by sharing with your most active fans first.",
        steps: ["Post 'Drugs In Da Club' to SoundCloud (if not already)", "Share link to Bass Heads FB group first", "Ask for comments, not just likes — comments weight heaviest", "Repost from label account for double exposure", "Monitor engagement-to-play ratio in first 48 hours"],
        expectedImpact: "Strong first-100 engagement = higher viral cap",
        costEstimate: "Free"
      },
      {
        name: "Next Pro → Daily Drops",
        priority: "MED",
        description: "If you have SoundCloud Next Pro, pitch for the 'Daily Drops' curated discovery feed.",
        steps: ["Check if account has Next Pro", "If yes, submit for Daily Drops pitching", "Tag properly: dubstep, riddim, bass music, heavy"],
        expectedImpact: "Discovery feed placement to new listeners",
        costEstimate: "Next Pro sub required"
      }
    ],
    tools: ["SoundCloud for Artists", "Next Pro", "Repost Network"],
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#FE2C55",
    artistScoreName: "Sound Authority",
    artistScoreRange: "Hidden",
    artistScoreCurrent: null,
    artistScoreTarget: null,
    artistScoreStatus: "HIDDEN",
    artistScoreExplain: "TikTok measures Sound Re-use and Completion Rate (rewatches = 5x more than likes). A track used in 1,000 TikToks is worth more than 100K streams.",
    trackScoreName: "Sound Re-use & Completion Rate",
    trackScoreRange: "Hidden",
    trackScoreCurrent: null,
    trackScoreTarget: null,
    trackScoreStatus: "HIDDEN",
    trackScoreExplain: "If creators start using 'Drugs In Da Club' audio in their TikToks, the algorithm massively boosts it. Completion rate (rewatches) is the second biggest signal.",
    keyMetric: "Sound Re-use Count + Completion Rate",
    keyMetricTarget: "50+ sound re-uses, >80% completion",
    keyMetricCurrent: "Unknown",
    decayRule: "Fast cycle — trends spike and fade within days",
    hacks: [
      {
        name: "Search-First SEO",
        priority: "HIGH",
        description: "TikTok is a search engine. Title TikToks with high-volume keywords so people FIND content through search, not just algorithmic feed.",
        steps: ["Post clips with SEO titles: 'heavy bass drop 2026 dubstep'", "'best riddim dubstep song 2026'", "'DirtySnatcha new music bass'", "Use the audio as a TikTok Sound so others can re-use it", "Pin the best-performing TikTok to profile"],
        expectedImpact: "Captures search traffic beyond For You Page",
        costEstimate: "Free"
      },
      {
        name: "Sound Seeding",
        priority: "HIGH",
        description: "Get 5-10 bass music creators to use the audio in their own TikToks. Sound re-use is the #1 signal for TikTok to push a track.",
        steps: ["Identify 5-10 bass music TikTok creators in tour markets", "Send them the track, ask them to use the audio", "Micro-creators with high completion rates work better than big accounts", "Support artists (WHOiSEE, Dark Matter, Mport) posting with the audio helps"],
        expectedImpact: "Each re-use signals TikTok to push the sound wider",
        costEstimate: "Free organic, $50-200 paid"
      },
      {
        name: "Commercial Music Library (CML)",
        priority: "MED",
        description: "Ensure track is in TikTok's Commercial Music Library so brands and creators can use it freely.",
        steps: ["Check with VMG if opted into TikTok CML", "If not, request opt-in through distribution portal", "Opens track to all commercial creators"],
        expectedImpact: "Wider pool of sound re-users",
        costEstimate: "Free"
      }
    ],
    tools: ["TikTok Artist Hub", "Commercial Music Library (CML)", "TikTok Ads Manager"],
  },
];

function statusColor(status) {
  return { LOW: "#ef4444", HIDDEN: "#64748b", UNKNOWN: "#f59e0b", ESTIMATED: "#22d3ee", OK: "#22c55e" }[status] || "#64748b";
}

function priorityBadge(p) {
  const colors = { HIGH: "#ef4444", MED: "#f59e0b", LOW: "#64748b", FUTURE: "#a855f7" };
  return { bg: colors[p] + "20", color: colors[p] };
}

export default function AlgorithmicHacker() {
  const [activeDSP, setActiveDSP] = useState("spotify");
  const [expandedHack, setExpandedHack] = useState(null);
  const [view, setView] = useState("overview");

  const dsp = DSPS.find(d => d.id === activeDSP);

  return (
    <div style={{ minHeight: "100vh", background: "#060b15", color: "#e2e8f0", fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a1120; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #0a1120 0%, #120822 50%, #0a1120 100%)", borderBottom: "1px solid #1e293b", padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, background: "linear-gradient(135deg, #ef4444, #f59e0b, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
              DSP ALGORITHMIC HACKER
            </h1>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              Hidden score tracker + hack playbook · DirtySnatcha · "Drugs In Da Club"
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ textAlign: "center", padding: "6px 14px", background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b" }}>
              <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Spotify Score</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#ef4444" }}>28</div>
              <div style={{ fontSize: 8, color: "#64748b" }}>Target: 40+</div>
            </div>
            <div style={{ textAlign: "center", padding: "6px 14px", background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b" }}>
              <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Track Age</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#22d3ee" }}>2d</div>
              <div style={{ fontSize: 8, color: "#64748b" }}>Critical window</div>
            </div>
            <div style={{ textAlign: "center", padding: "6px 14px", background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b" }}>
              <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Decay Clock</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>6w</div>
              <div style={{ fontSize: 8, color: "#64748b" }}>Next ISRC due</div>
            </div>
          </div>
        </div>
      </div>

      {/* CRITICAL ALERT */}
      <div style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.15)", padding: "8px 20px", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#ef4444" }}>
        ⚡ CRITICAL: "Drugs In Da Club" is 2 days old — first 7 days determine permanent algorithmic placement. Every save, share, and completion NOW matters 10x more than next week.
      </div>

      {/* VIEW TOGGLE */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e293b", background: "#0a1120" }}>
        {["overview", "deep-dive"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "10px 20px", background: view === v ? "#1e293b" : "transparent", border: "none", borderBottom: view === v ? "2px solid #a855f7" : "2px solid transparent", color: view === v ? "#e2e8f0" : "#475569", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {v === "overview" ? "🎯 All Platforms Overview" : "🔬 Deep Dive + Hacks"}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* OVERVIEW */}
        {view === "overview" && (
          <div style={{ display: "grid", gap: 8 }}>
            {DSPS.map(d => {
              const highHacks = d.hacks.filter(h => h.priority === "HIGH");
              return (
                <div key={d.id} onClick={() => { setActiveDSP(d.id); setView("deep-dive"); }} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 140px", padding: "12px 14px", background: "#0f172a", borderRadius: 6, borderLeft: `3px solid ${d.color}`, cursor: "pointer", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: d.color, fontFamily: "'Outfit', sans-serif" }}>{d.name}</div>
                    <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{d.tools.length} tools</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Artist Score</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {d.artistScoreName}
                      {d.artistScoreCurrent !== null ? (
                        <span style={{ color: statusColor(d.artistScoreStatus), fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginLeft: 6 }}>{d.artistScoreCurrent}{d.artistScoreTarget ? ` → ${d.artistScoreTarget}` : ""}</span>
                      ) : (
                        <span style={{ color: "#475569", fontFamily: "'JetBrains Mono', monospace", marginLeft: 6, fontSize: 9 }}>HIDDEN</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Track Score</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {d.trackScoreName}
                      <span style={{ color: "#475569", fontFamily: "'JetBrains Mono', monospace", marginLeft: 6, fontSize: 9 }}>{d.trackScoreStatus === "HIDDEN" ? "HIDDEN" : "UNKNOWN"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {highHacks.length > 0 && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 3, background: "rgba(239,68,68,0.15)", color: "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>{highHacks.length} HIGH PRIORITY</span>
                    )}
                    <div style={{ fontSize: 9, color: "#475569", marginTop: 4 }}>{d.hacks.length} hacks →</div>
                  </div>
                </div>
              );
            })}

            {/* SUPPLY CHAIN */}
            <div style={{ marginTop: 12, padding: 16, background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b" }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>🧬 ISRC / UPC Supply Chain</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11 }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Rules</div>
                  <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                    <strong style={{ color: "#ef4444" }}>ISRC (The DNA):</strong> Unique to audio. NEVER change it.<br />
                    <strong style={{ color: "#22d3ee" }}>UPC (The Vessel):</strong> Unique to product. ALWAYS change for new bundle.<br />
                    <strong style={{ color: "#22c55e" }}>Waterfall:</strong> Single → EP with same ISRC in new UPC. EP debuts with accumulated Track Score.
                  </div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Drugs In Da Club Status</div>
                  <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                    ISRC: <span style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>NEEDS VERIFICATION</span><br />
                    UPC: <span style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>NEEDS VERIFICATION</span><br />
                    BMI/ASCAP: <span style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>CHECK</span><br />
                    SoundExchange: <span style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>CHECK</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WEEK 1 ACTION PLAN */}
            <div style={{ marginTop: 4, padding: 16, background: "#0f172a", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)" }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 10 }}>🔥 WEEK 1 ACTION PLAN — "Drugs In Da Club"</h3>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  { action: "Enable Discovery Mode on Spotify", platform: "Spotify", cost: "Free", impact: "2-3x algorithmic impressions" },
                  { action: "Upload Canvas + Clips", platform: "Spotify", cost: "Free", impact: "145% more shares" },
                  { action: "Set as Featured Track on Pandora AMP", platform: "Pandora", cost: "Free", impact: "8 weeks forced exposure" },
                  { action: "Create 3-5 YouTube Shorts with track audio", platform: "YouTube", cost: "Free", impact: "Audio re-use signals" },
                  { action: "Run Shazam Spike — $50 ads in ABQ", platform: "Apple", cost: "$50", impact: "Regional trending alert" },
                  { action: "Post TikToks with SEO titles", platform: "TikTok", cost: "Free", impact: "Search discovery" },
                  { action: "Share to Bass Heads group for SoundCloud 100-test", platform: "SoundCloud", cost: "Free", impact: "Strong first-100 engagement" },
                  { action: "Run Save-focused Meta ads ($50-100)", platform: "Spotify", cost: "$50-100", impact: "Push save ratio >10%" },
                  { action: "Add Alexa CTA to social posts", platform: "Amazon", cost: "Free", impact: "Voice request signals" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 160px", padding: "8px 10px", background: "#080e1a", borderRadius: 4, alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#e2e8f0" }}>{item.action}</span>
                    <span style={{ fontSize: 9, color: DSPS.find(d => d.name === item.platform)?.color || "#64748b", fontWeight: 600 }}>{item.platform}</span>
                    <span style={{ fontSize: 10, color: item.cost === "Free" ? "#22c55e" : "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>{item.cost}</span>
                    <span style={{ fontSize: 9, color: "#64748b" }}>{item.impact}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                Total cost: $100-250 · 7 of 9 actions are FREE · All must happen THIS WEEK
              </div>
            </div>
          </div>
        )}

        {/* DEEP DIVE */}
        {view === "deep-dive" && dsp && (
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
              {DSPS.map(d => (
                <button key={d.id} onClick={() => { setActiveDSP(d.id); setExpandedHack(null); }} style={{ padding: "6px 14px", fontSize: 10, fontWeight: 700, borderRadius: 4, border: `1px solid ${activeDSP === d.id ? d.color : "#1e293b"}`, background: activeDSP === d.id ? d.color + "18" : "transparent", color: activeDSP === d.id ? d.color : "#475569", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                  {d.name}
                </button>
              ))}
            </div>

            {/* SCORES */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 14, background: "#0f172a", borderRadius: 6, border: `1px solid ${dsp.color}30` }}>
                <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Artist Score: {dsp.artistScoreName}</div>
                {dsp.artistScoreCurrent !== null ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: statusColor(dsp.artistScoreStatus) }}>{dsp.artistScoreCurrent}</span>
                    {dsp.artistScoreTarget && <span style={{ fontSize: 12, color: "#475569" }}>/ target: {dsp.artistScoreTarget}</span>}
                  </div>
                ) : (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#475569", marginBottom: 8 }}>HIDDEN — not exposed via API</div>
                )}
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{dsp.artistScoreExplain}</div>
              </div>
              <div style={{ padding: 14, background: "#0f172a", borderRadius: 6, border: `1px solid ${dsp.color}30` }}>
                <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Track Score: {dsp.trackScoreName}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#475569", marginBottom: 8 }}>HIDDEN — estimated from proxy signals</div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{dsp.trackScoreExplain}</div>
                <div style={{ marginTop: 8, padding: "6px 10px", background: "#080e1a", borderRadius: 4 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>KEY METRIC: </span>
                  <span style={{ fontSize: 10, color: dsp.color, fontWeight: 600 }}>{dsp.keyMetric}</span>
                  <span style={{ fontSize: 9, color: "#475569", marginLeft: 8 }}>Target: {dsp.keyMetricTarget}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: "8px 14px", background: "rgba(245,158,11,0.06)", borderRadius: 4, border: "1px solid rgba(245,158,11,0.15)", marginBottom: 16, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ color: "#f59e0b" }}>⏳ DECAY RULE:</span>
              <span style={{ color: "#94a3b8", marginLeft: 8 }}>{dsp.decayRule}</span>
            </div>

            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: dsp.color, marginBottom: 10 }}>HACK PLAYBOOK — {dsp.name}</h3>
            <div style={{ display: "grid", gap: 6 }}>
              {dsp.hacks.map((hack, i) => {
                const pb = priorityBadge(hack.priority);
                const isOpen = expandedHack === `${dsp.id}-${i}`;
                return (
                  <div key={i}>
                    <div onClick={() => setExpandedHack(isOpen ? null : `${dsp.id}-${i}`)} style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 30px", padding: "10px 12px", background: "#0f172a", borderRadius: isOpen ? "6px 6px 0 0" : 6, cursor: "pointer", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 3, background: pb.bg, color: pb.color, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>{hack.priority}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{hack.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{hack.description.slice(0, 80)}...</div>
                      </div>
                      <span style={{ fontSize: 10, color: hack.costEstimate.includes("Free") ? "#22c55e" : "#f59e0b", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>{hack.costEstimate}</span>
                      <span style={{ color: "#475569", textAlign: "right" }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: "12px 16px", background: "#080e1a", borderRadius: "0 0 6px 6px", borderTop: `1px solid ${dsp.color}20` }}>
                        <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.6, marginBottom: 12 }}>{hack.description}</div>
                        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Steps</div>
                        {hack.steps.map((step, j) => (
                          <div key={j} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 11 }}>
                            <span style={{ color: dsp.color, fontFamily: "'JetBrains Mono', monospace", minWidth: 16 }}>{j + 1}.</span>
                            <span style={{ color: "#94a3b8" }}>{step}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 16, marginTop: 10, padding: "8px 10px", background: "#0f172a", borderRadius: 4 }}>
                          <div>
                            <span style={{ fontSize: 9, color: "#475569" }}>IMPACT: </span>
                            <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>{hack.expectedImpact}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: 9, color: "#475569" }}>COST: </span>
                            <span style={{ fontSize: 10, color: hack.costEstimate.includes("Free") ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>{hack.costEstimate}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "#0f172a", borderRadius: 6, border: "1px solid #1e293b" }}>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Available Tools — {dsp.name}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {dsp.tools.map(tool => (
                  <span key={tool} style={{ padding: "4px 10px", background: dsp.color + "15", color: dsp.color, borderRadius: 3, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{tool}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
