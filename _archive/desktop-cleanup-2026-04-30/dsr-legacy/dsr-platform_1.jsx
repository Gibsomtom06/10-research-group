import { useState, useRef, useEffect } from "react";

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
    systemPrompt: `You are an elite music industry AI agent for DirtySnatcha (Leigh Bray), managed by Thomas Nalian at DirtySnatcha Records.

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
    systemPrompt: `You are an elite music industry AI agent for WHOiSEE (Brett), signed to DirtySnatcha Records, managed by Thomas Nalian.

ARTIST DATA:
- Artist: WHOiSEE | Based in: North Carolina
- Label: DirtySnatcha Records
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Genre: Dubstep / Riddim / Bass Music
- Tier: Development (Tier 1 support on DirtySnatcha tour)

ACTIVE DEAL:
- Circus Records UK EP — ACTIVE NEGOTIATION
- Key contacts: Holly Grainger (holly@circus-records.co.uk), Andrew Neill (andrew@circus-records.co.uk), Jamie Kingett (jamie@circus-records.co.uk), Sophie Dickinson (sophie@circus-records.co.uk)
- Status: Artwork sidebar/title format decision pending. Holly confirmed assets and marketing plans on main thread. WHOiSEE (Brett) managing artwork direction.
- Open item: Title format — sidebar on image? Holly confirmed yes, has template ready.

UPCOMING SHOWS (as support on DS tour):
- March 14 — Pittsburgh @ SideQuest (w/ DirtySnatcha, Dark Matter)
- April 24 — Asbury Park, NJ @ House of Independents (w/ DirtySnatcha, Dark Matter)
- April 25 — Hartford, CT (w/ DirtySnatcha)

VOICE: Direct, specific. WHOiSEE's brand is "if you know you know" — understated confidence. Not hype-beast, not corporate. Real and authentic.

GUARDRAILS: Never give legal advice on the Circus deal — flag key terms, recommend music attorney. Never fabricate metrics. Never share other DSR artist financials with WHOiSEE.`,
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
    systemPrompt: `You are an elite music industry AI agent for Dark Matter, signed to DirtySnatcha Records, managed by Thomas Nalian.

ARTIST DATA:
- Artist: Dark Matter | Based in: Chicago / Knoxville
- Label: DirtySnatcha Records
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
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

VOICE: Direct, no fluff. Dark Matter's brand is dark, heavy, cinematic bass. Content tone: atmospheric, intense, not hype-bro.

GUARDRAILS: Never give legal advice. Never fabricate metrics. Never share other DSR artist financials with Dark Matter.`,
  },
};

const MANAGER = {
  id: "manager",
  name: "Thomas Nalian",
  label: "DirtySnatcha Records — Manager View",
  color: "#f59e0b",
  accent: "#ef4444",
  emoji: "⚡",
  tagline: "Full roster. Full control.",
  passcode: "TN2026",
  systemPrompt: `You are an elite music industry AI agent for Thomas Nalian, manager of DirtySnatcha Records.

MANAGER PROFILE:
- Thomas Nalian | thomas@dirtysnatcha.com | 248-765-1997
- Commission: 10% (agent booking) / 20% (direct booking)
- Label: DirtySnatcha Records | Distributor: VMG

FULL ROSTER:
1. DirtySnatcha (Leigh Bray) — Headline artist. Take Me To Your Leader 2026 tour, 17 shows, ~$38,600 guaranteed. Active release: "Drugs In Da Club" (Feb 27).
2. WHOiSEE (Brett, NC) — Circus Records UK EP deal in progress. Support on DS tour.
3. Dark Matter (Chicago/Knoxville) — Wakaan release. Support on DS tour.
4. OZZTIN — DSR roster
5. MAVIC — DSR roster  
6. PRIYANX — DSR roster

🔴 URGENT RIGHT NOW:
- Pittsburgh deposit $1,250 OVERDUE 18+ days — no promoter contact. Get from Colton immediately.
- Houston/Dallas artwork — Andrew Winters sent Drive link. Waiting for approval/billing decision. Watching.
- WHOiSEE Circus EP artwork — sidebar title format decision needed with Holly Grainger.
- Albuquerque March 6 — 3 days out, partial deposit only, no signed contract.
- DirtyT April 18 — 23 tickets sold, 227 remaining. Needs marketing push.

🟡 THIS WEEK:
- Spokane counter offer ($3K) sent to Andrew Z — awaiting response
- Tampa venue TBD — 10 days out, at risk
- Butte May 2 — full advance needed (rider sent, hotel/ground/ticket pending)
- WHOiSEE OKC May 15 — deposit and contract from Justin McGary

COMMISSION STRUCTURE:
- Agent booking (10% manager / 10% agent / 80% artist)
- Direct booking (20% manager / 80% artist)

VOICE: Elite manager. Direct, specific, blunt. Real dollar amounts, dates, names. 3 priorities not 20. Every recommendation has a CTA with who to contact and by when.`,
};

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
          ⚡
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`}
        style={isUser ? {
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff",
          borderRadius: "18px 18px 4px 18px"
        } : {
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.9)",
          borderRadius: "18px 18px 18px 4px"
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
        ⚡
      </div>
      <div className="px-4 py-3 rounded-2xl" style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "18px 18px 18px 4px"
      }}>
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: "rgba(255,255,255,0.4)", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatView({ entity, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const color = entity.color;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      sendGreeting();
    }
  }, []);

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
      const reply = data.content?.[0]?.text || "Ready when you are.";
      setMessages([{ role: "assistant", content: reply }]);
    } catch (e) {
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
      const reply = data.content?.[0]?.text || "Something went wrong.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Try again." }]);
    }
    setLoading(false);
  };

  const quickPrompts = entity.id === "manager"
    ? ["Daily briefing", "Tour P&L", "What's overdue?", "Pittsburgh deposit status"]
    : entity.id === "dirtysnatcha"
    ? ["What's urgent today?", "Albuquerque advance status", "DirtyT ticket count", "Content for this week"]
    : entity.id === "whoisee"
    ? ["Circus Records status", "Pittsburgh advance", "What should I focus on?", "Release timing check"]
    : ["Wakaan release strategy", "Pittsburgh advance", "What should I focus on?", "Content ideas"];

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button onClick={onBack} className="text-sm px-3 py-1 rounded-lg transition-all"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
          ← Back
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
            style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
            {entity.emoji}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color }}>{entity.name}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{entity.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00ff88" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => <Message key={i} msg={m} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && !loading && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {quickPrompts.map((p, i) => (
            <button key={i} onClick={() => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{ background: `${color}18`, border: `1px solid ${color}33`, color: color }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex gap-2 items-end rounded-2xl p-1" style={{
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${loading ? color + "44" : "rgba(255,255,255,0.12)"}`,
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
              background: input.trim() && !loading ? color : "rgba(255,255,255,0.1)",
              color: input.trim() && !loading ? "#000" : "rgba(255,255,255,0.3)"
            }}>
            ↑
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function PasscodeModal({ entity, onSuccess, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const check = () => {
    if (code.toUpperCase() === entity.passcode) {
      onSuccess();
    } else {
      setError(true);
      setCode("");
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{
        background: "#13131a",
        border: `1px solid ${entity.color}33`
      }}>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{entity.emoji}</div>
          <div className="text-lg font-semibold text-white mb-1">{entity.name}</div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Enter your access code</div>
        </div>
        <input
          ref={inputRef}
          type="password"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && check()}
          placeholder="Access code"
          className="w-full text-center text-lg tracking-widest rounded-xl px-4 py-3 outline-none transition-all mb-4"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${error ? "#ef4444" : entity.color + "44"}`,
            color: error ? "#ef4444" : "white",
            letterSpacing: "0.3em"
          }}
        />
        {error && <p className="text-center text-sm text-red-400 mb-3">Incorrect code. Try again.</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
            Cancel
          </button>
          <button onClick={check} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: entity.color, color: "#000" }}>
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}

function ArtistCard({ entity, onSelect }) {
  return (
    <button onClick={() => onSelect(entity)}
      className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${entity.color}33`,
        boxShadow: `0 0 40px ${entity.color}08`
      }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${entity.color}18`, border: `1px solid ${entity.color}33` }}>
          {entity.emoji}
        </div>
        <div>
          <div className="font-bold text-white text-base">{entity.name}</div>
          <div className="text-xs" style={{ color: entity.color }}>{entity.label}</div>
        </div>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
        {entity.tagline}
      </p>
      {entity.profile && (
        <div className="flex flex-wrap gap-1">
          {entity.profile.genre && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${entity.color}18`, color: entity.color }}>
              {entity.profile.genre.split(" / ")[0]}
            </span>
          )}
          {entity.profile.location && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
              {entity.profile.location}
            </span>
          )}
          {entity.profile.status && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
              Active
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Tap to enter</span>
        <span style={{ color: entity.color }}>→</span>
      </div>
    </button>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [authenticated, setAuthenticated] = useState(null);
  const [showPasscode, setShowPasscode] = useState(false);

  const handleSelect = (entity) => {
    setSelected(entity);
    setShowPasscode(true);
  };

  const handleAuth = () => {
    setShowPasscode(false);
    setAuthenticated(selected);
  };

  const handleBack = () => {
    setAuthenticated(null);
    setSelected(null);
  };

  if (authenticated) {
    return <ChatView entity={authenticated} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00ff88" }} />
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            DirtySnatcha Records Platform
          </span>
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
          DSR <span style={{ color: "#00ff88" }}>AI</span>
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Select your profile to continue
        </p>
      </div>

      {/* Manager Card */}
      <div className="px-4 mb-3">
        <button onClick={() => handleSelect(MANAGER)}
          className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))",
            border: "1px solid rgba(245,158,11,0.3)"
          }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)" }}>
                ⚡
              </div>
              <div>
                <div className="font-bold text-white">Manager Dashboard</div>
                <div className="text-xs" style={{ color: "rgba(245,158,11,0.8)" }}>Thomas Nalian · Full Roster Access</div>
              </div>
            </div>
            <div className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>
              Admin
            </div>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 px-4 my-4">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Artists</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Artist Cards */}
      <div className="px-4 flex flex-col gap-3 pb-12">
        {Object.values(ARTISTS).map(artist => (
          <ArtistCard key={artist.id} entity={artist} onSelect={handleSelect} />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          AMOS · v0.1 · March 2026
        </p>
      </div>

      {/* Passcode Modal */}
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
