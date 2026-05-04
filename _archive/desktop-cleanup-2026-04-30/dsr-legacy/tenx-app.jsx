import { useState, useEffect, useCallback } from "react";

/*
  TENx MVP — Functional Prototype
  
  3 modules:
  1. Daily Briefing — AI scans Gmail + tour data → morning report
  2. Tour Status — Live show grid with alerts
  3. Offer Evaluator — Parse offer emails → 6-step engine → action
  
  Backend: Anthropic API (Claude) + Gmail MCP
  
  NOTE: In production, auth + Gmail OAuth would be server-side.
  For this prototype, we use the Anthropic API directly from the client
  since it's built as a Claude artifact with API access baked in.
*/

const SYSTEM_PROMPT = `You are TENx, an elite AI music industry management platform. You are direct, specific, and data-driven. You never give generic advice.

CORE RULES:
- Be specific: dollar amounts, dates, names, deadlines
- Prioritize ruthlessly: 3 things that matter today, not 20
- Don't sugarcoat: if a show loses money, say so
- Include a CTA in every recommendation: what to do, who to contact, by when
- Use the artist's real data, never fabricate

IDENTITY:
- Artist: DirtySnatcha (legal: Lee Bray or Leigh Bray — NEVER "Lee Silva")
- Label: DirtySnatcha Records
- Manager: Thomas Nalian (thomas@dirtysnatcha.com / 248-765-1997)
- Primary Agent: Andrew at AB Touring (andrew@abtouring.com)
- Legacy Agent: Colton Anderson at PRYSM (colton@prysmtalentagency.com / 734-904-0224)

COMMISSION STRUCTURE: 10% Manager / 10% Agent / 80% Artist
FLOOR: $1,500 minimum guarantee

DAILY BRIEFING FORMAT:
Good {morning/afternoon}, Thomas. Here's what matters today.

🔴 URGENT — DO TODAY:
• [Specific action with exact details]

🟡 THIS WEEK:
• [Action with deadline]

📊 METRICS CHECK:
• [key metric]: [value] ([trend])

💡 RECOMMENDATION:
[One strategic recommendation based on actual data]

OFFER EVALUATION FORMAT:
Run this 6-step engine on every offer:
1. FLOOR CHECK: Is guarantee ≥ $1,500?
2. MARKET CHECK: New or returning market? Previous guarantee?
3. CPT ANALYSIS: Cost per ticket = (ad spend + travel) / expected attendance
4. CALENDAR CHECK: Routing opportunities? Conflicts? If MAD, compare all dates
5. PROMOTER CHECK: Known or unknown? Grade? Deposit requirements?
6. MARKETING CHECK: Did promoter commit ad spend?

Output: ACCEPT / COUNTER / DECLINE with specific dollar amounts and terms.
Always check radius clauses against ALL existing tour dates.
Always draft a reply email ready to send.`;

const GMAIL_MCP = {
  type: "url",
  url: "https://gmail.mcp.claude.com/mcp",
  name: "gmail"
};

// API call helper
async function callClaude(messages, tools = [], mcpServers = []) {
  try {
    const body = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages,
    };
    if (tools.length > 0) body.tools = tools;
    if (mcpServers.length > 0) body.mcp_servers = mcpServers;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Extract text from all content blocks
    const textParts = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text);
    
    // Extract MCP tool results
    const toolResults = (data.content || [])
      .filter(b => b.type === "mcp_tool_result")
      .map(b => b.content?.[0]?.text || "")
      .filter(Boolean);

    return {
      text: textParts.join("\n"),
      toolResults,
      raw: data,
      error: null,
    };
  } catch (err) {
    return { text: "", toolResults: [], raw: null, error: err.message };
  }
}

// Simple markdown-ish renderer
function RenderText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h2 key={i} style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", margin: "16px 0 8px", fontFamily: "'Outfit', sans-serif" }}>{line.slice(2)}</h2>;
        if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "12px 0 6px", fontFamily: "'Outfit', sans-serif" }}>{line.slice(3)}</h3>;
        if (line.startsWith("### ")) return <h4 key={i} style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", margin: "10px 0 4px", fontFamily: "'Outfit', sans-serif" }}>{line.slice(4)}</h4>;
        if (line.startsWith("🔴") || line.startsWith("⚠")) return <div key={i} style={{ color: "#ef4444", padding: "4px 0", fontSize: 13, lineHeight: 1.6 }}>{line}</div>;
        if (line.startsWith("🟡")) return <div key={i} style={{ color: "#f59e0b", padding: "4px 0", fontSize: 13, lineHeight: 1.6 }}>{line}</div>;
        if (line.startsWith("📊") || line.startsWith("💡") || line.startsWith("📋")) return <div key={i} style={{ color: "#22d3ee", padding: "4px 0", fontSize: 13, lineHeight: 1.6 }}>{line}</div>;
        if (line.startsWith("✅")) return <div key={i} style={{ color: "#22c55e", padding: "4px 0", fontSize: 13, lineHeight: 1.6 }}>{line}</div>;
        if (line.startsWith("❌")) return <div key={i} style={{ color: "#ef4444", padding: "4px 0", fontSize: 13, lineHeight: 1.6 }}>{line}</div>;
        if (line.startsWith("•") || line.startsWith("-")) return <div key={i} style={{ color: "#cbd5e1", padding: "2px 0 2px 12px", fontSize: 13, lineHeight: 1.6 }}>{line}</div>;
        if (line.startsWith("```")) return null;
        if (line.startsWith("━")) return <hr key={i} style={{ border: "none", borderTop: "1px solid #1e293b", margin: "12px 0" }} />;
        if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
        
        // Bold text
        const boldParts = line.split(/\*\*(.*?)\*\*/g);
        if (boldParts.length > 1) {
          return (
            <div key={i} style={{ color: "#cbd5e1", padding: "2px 0", fontSize: 13, lineHeight: 1.6 }}>
              {boldParts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: "#e2e8f0", fontWeight: 700 }}>{part}</strong> : part)}
            </div>
          );
        }
        
        return <div key={i} style={{ color: "#cbd5e1", padding: "2px 0", fontSize: 13, lineHeight: 1.6 }}>{line}</div>;
      })}
    </div>
  );
}

// Loading spinner
function Loader({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20 }}>
      <div style={{
        width: 16, height: 16, border: "2px solid #1e293b",
        borderTopColor: "#a855f7", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ fontFamily: mono, fontSize: 11, color: "#64748b" }}>{text}</span>
    </div>
  );
}

const mono = "'JetBrains Mono', monospace";
const sans = "'Outfit', sans-serif";

export default function TENxApp() {
  const [activeTab, setActiveTab] = useState("briefing");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [briefingResult, setBriefingResult] = useState(null);
  const [offerResult, setOfferResult] = useState(null);
  const [tourResult, setTourResult] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState(null);

  // DAILY BRIEFING
  const runBriefing = useCallback(async () => {
    setLoading(true);
    setLoadingText("Scanning Gmail for updates...");
    setError(null);

    const result = await callClaude(
      [{
        role: "user",
        content: `Run a daily briefing for Thomas. Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.

Search my Gmail for:
1. Any new offer emails from andrew@abtouring.com or colton@prysmtalentagency.com in the last 48 hours
2. Any emails with "confirmed" or "contract" in the subject from the last 7 days
3. Any urgent follow-ups needed

Then give me the full daily briefing format with urgent items, this week priorities, and one strategic recommendation.`
      }],
      [],
      [GMAIL_MCP]
    );

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setBriefingResult(result.text);
    }
  }, []);

  // OFFER EVALUATOR
  const runOfferScan = useCallback(async () => {
    setLoading(true);
    setLoadingText("Searching Gmail for new offers...");
    setError(null);

    const result = await callClaude(
      [{
        role: "user",
        content: `Search my Gmail for any new offer emails. Check:
1. from:andrew@abtouring.com subject:offer (last 7 days)
2. from:colton@prysmtalentagency.com subject:offer (last 7 days)
3. Any email with "OFFER" or "MAD" in the subject line from the last 7 days

For each offer found:
- Parse the email body for all deal terms
- Note if there are PDF attachments that need manual review
- Run the 6-step booking decision engine
- Output the full evaluation with ACCEPT / COUNTER / DECLINE recommendation
- Draft a reply email

If no new offers found, say so and suggest proactive outreach to agents.`
      }],
      [],
      [GMAIL_MCP]
    );

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOfferResult(result.text);
    }
  }, []);

  // TOUR STATUS
  const runTourStatus = useCallback(async () => {
    setLoading(true);
    setLoadingText("Pulling tour data from Gmail...");
    setError(null);

    const result = await callClaude(
      [{
        role: "user",
        content: `Search my Gmail for all confirmed show emails. Check:
1. Emails with "CONFIRMED" in the subject from colton@prysmtalentagency.com
2. Emails with "CONFIRMED" or "confirmed" from andrew@abtouring.com
3. Any recent emails about show dates, venues, or contracts

Build a tour status grid showing:
- Each confirmed show: date, city, venue, guarantee, status
- Flag any shows missing: contracts, deposits, ticket links
- Flag any shows within 14 days that need immediate attention
- Calculate total guaranteed income across all shows
- Note any pending offers or shows in negotiation

Format as a tour command report with alerts.`
      }],
      [],
      [GMAIL_MCP]
    );

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setTourResult(result.text);
    }
  }, []);

  // CHAT / CUSTOM QUERY
  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    setLoadingText("Processing...");
    setError(null);

    const messages = [
      ...chatHistory.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text
      })),
      { role: "user", content: msg }
    ];

    const result = await callClaude(messages, [], [GMAIL_MCP]);
    
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setChatHistory(prev => [...prev, { role: "assistant", text: result.text }]);
    }
  }, [chatInput, chatHistory]);

  return (
    <div style={{ minHeight: "100vh", background: "#080e1a", color: "#e2e8f0", fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .tab-btn { transition: all 0.15s; cursor: pointer; }
        .tab-btn:hover { color: #e2e8f0 !important; background: #1e293b !important; }
        .action-btn { transition: all 0.2s; cursor: pointer; }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.2); }
      `}</style>

      {/* HEADER */}
      <header style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a0a2e 50%, #0f172a 100%)",
        borderBottom: "1px solid #1e293b", padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h1 style={{
            fontFamily: mono, fontSize: 16, fontWeight: 800,
            background: "linear-gradient(135deg, #a855f7, #22d3ee)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            TENx COMMAND CENTER
          </h1>
          <div style={{ fontFamily: mono, fontSize: 9, color: "#475569", marginTop: 2 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s ease infinite" }} />
          <span style={{ fontFamily: mono, fontSize: 9, color: "#475569" }}>CONNECTED</span>
        </div>
      </header>

      {/* TABS */}
      <nav style={{ display: "flex", background: "#0c1222", borderBottom: "1px solid #1e293b" }}>
        {[
          { id: "briefing", label: "📋 Daily Briefing", action: runBriefing },
          { id: "tour", label: "🛸 Tour Status", action: runTourStatus },
          { id: "offers", label: "⚡ Offer Evaluator", action: runOfferScan },
          { id: "chat", label: "💬 Chat", action: null },
        ].map(tab => (
          <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px", border: "none",
              background: activeTab === tab.id ? "#1e293b" : "transparent",
              color: activeTab === tab.id ? "#e2e8f0" : "#475569",
              borderBottom: activeTab === tab.id ? "2px solid #a855f7" : "2px solid transparent",
              fontSize: 11, fontWeight: 600, fontFamily: sans,
            }}>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>

        {/* DAILY BRIEFING */}
        {activeTab === "briefing" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Daily Briefing</h2>
                <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>AI scans your Gmail, pulls tour data, and tells you what matters today.</p>
              </div>
              <button className="action-btn" onClick={runBriefing} disabled={loading}
                style={{
                  padding: "8px 20px", border: "none", borderRadius: 4,
                  background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                  color: "#fff", fontFamily: mono, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.06em", opacity: loading ? 0.5 : 1,
                }}>
                {loading && activeTab === "briefing" ? "RUNNING..." : "RUN BRIEFING"}
              </button>
            </div>

            {loading && activeTab === "briefing" && <Loader text={loadingText} />}
            {error && <div style={{ padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, fontFamily: mono, fontSize: 11, color: "#ef4444" }}>Error: {error}</div>}
            {briefingResult && (
              <div style={{ padding: 16, background: "#0c1222", border: "1px solid #1e293b", borderRadius: 6 }}>
                <RenderText text={briefingResult} />
              </div>
            )}
            {!briefingResult && !loading && !error && (
              <div style={{ padding: 40, textAlign: "center", color: "#334155" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontFamily: mono, fontSize: 11 }}>Hit "Run Briefing" to scan your inbox and generate today's report.</div>
              </div>
            )}
          </div>
        )}

        {/* TOUR STATUS */}
        {activeTab === "tour" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Tour Status</h2>
                <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Live show grid pulled from your confirmed emails and contracts.</p>
              </div>
              <button className="action-btn" onClick={runTourStatus} disabled={loading}
                style={{
                  padding: "8px 20px", border: "none", borderRadius: 4,
                  background: "linear-gradient(135deg, #22d3ee, #0891b2)",
                  color: "#0f172a", fontFamily: mono, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.06em", opacity: loading ? 0.5 : 1,
                }}>
                {loading && activeTab === "tour" ? "SCANNING..." : "PULL STATUS"}
              </button>
            </div>

            {loading && activeTab === "tour" && <Loader text={loadingText} />}
            {error && <div style={{ padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, fontFamily: mono, fontSize: 11, color: "#ef4444" }}>Error: {error}</div>}
            {tourResult && (
              <div style={{ padding: 16, background: "#0c1222", border: "1px solid #1e293b", borderRadius: 6 }}>
                <RenderText text={tourResult} />
              </div>
            )}
            {!tourResult && !loading && !error && (
              <div style={{ padding: 40, textAlign: "center", color: "#334155" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🛸</div>
                <div style={{ fontFamily: mono, fontSize: 11 }}>Hit "Pull Status" to scan confirmed shows from your inbox.</div>
              </div>
            )}
          </div>
        )}

        {/* OFFER EVALUATOR */}
        {activeTab === "offers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Offer Evaluator</h2>
                <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Scans for new offers, runs 6-step engine, drafts reply.</p>
              </div>
              <button className="action-btn" onClick={runOfferScan} disabled={loading}
                style={{
                  padding: "8px 20px", border: "none", borderRadius: 4,
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff", fontFamily: mono, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.06em", opacity: loading ? 0.5 : 1,
                }}>
                {loading && activeTab === "offers" ? "SCANNING..." : "SCAN FOR OFFERS"}
              </button>
            </div>

            {loading && activeTab === "offers" && <Loader text={loadingText} />}
            {error && <div style={{ padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, fontFamily: mono, fontSize: 11, color: "#ef4444" }}>Error: {error}</div>}
            {offerResult && (
              <div style={{ padding: 16, background: "#0c1222", border: "1px solid #1e293b", borderRadius: 6 }}>
                <RenderText text={offerResult} />
              </div>
            )}
            {!offerResult && !loading && !error && (
              <div style={{ padding: 40, textAlign: "center", color: "#334155" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                <div style={{ fontFamily: mono, fontSize: 11 }}>Hit "Scan for Offers" to check your inbox for new deals.</div>
              </div>
            )}
          </div>
        )}

        {/* CHAT */}
        {activeTab === "chat" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Chat</h2>
              <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Ask anything — "should I take this show?", "email the promoter", "what should I post today?"</p>
            </div>

            {/* Chat messages */}
            <div style={{
              minHeight: 300, maxHeight: 500, overflowY: "auto",
              padding: 16, background: "#0c1222", border: "1px solid #1e293b",
              borderRadius: "6px 6px 0 0", display: "flex", flexDirection: "column", gap: 12,
            }}>
              {chatHistory.length === 0 && !loading && (
                <div style={{ padding: 40, textAlign: "center", color: "#334155" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                  <div style={{ fontFamily: mono, fontSize: 11 }}>Ask me anything about your tour, shows, offers, or releases.</div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} style={{
                  padding: "10px 14px", borderRadius: 6,
                  background: msg.role === "user" ? "rgba(168,85,247,0.08)" : "#0f172a",
                  borderLeft: msg.role === "user" ? "3px solid #a855f7" : "3px solid #22d3ee",
                }}>
                  <div style={{ fontFamily: mono, fontSize: 8, color: msg.role === "user" ? "#a855f7" : "#22d3ee", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {msg.role === "user" ? "You" : "TENx"}
                  </div>
                  {msg.role === "user" ? (
                    <div style={{ fontSize: 13, color: "#e2e8f0" }}>{msg.text}</div>
                  ) : (
                    <RenderText text={msg.text} />
                  )}
                </div>
              ))}
              {loading && activeTab === "chat" && <Loader text={loadingText} />}
            </div>

            {/* Chat input */}
            <div style={{
              display: "flex", gap: 8, padding: 12,
              background: "#0f172a", border: "1px solid #1e293b",
              borderTop: "none", borderRadius: "0 0 6px 6px",
            }}>
              <input
                type="text" value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && sendChat()}
                placeholder="got an offer from andrew for austin tx..."
                style={{
                  flex: 1, padding: "10px 14px", fontFamily: mono, fontSize: 12,
                  background: "#080e1a", border: "1px solid #1e293b", borderRadius: 4,
                  color: "#e2e8f0", outline: "none",
                }}
              />
              <button className="action-btn" onClick={sendChat} disabled={loading || !chatInput.trim()}
                style={{
                  padding: "10px 20px", border: "none", borderRadius: 4,
                  background: chatInput.trim() ? "linear-gradient(135deg, #a855f7, #7c3aed)" : "#1e293b",
                  color: chatInput.trim() ? "#fff" : "#334155",
                  fontFamily: mono, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.06em",
                }}>
                SEND
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
