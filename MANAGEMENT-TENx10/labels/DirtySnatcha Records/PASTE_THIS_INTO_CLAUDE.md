# Claude Conversation Starter

**Instructions:** Copy everything below the line and paste it as your first message to Claude. Attach the `artist_bible_handoff_package.zip` file to the same message.

---

I'm handing off a project to you. Everything you need is in the attached zip file. Please read every file before responding.

## Project: Artist Bible Platform — 7-Agent Tour Marketing Automation System

I am building an AI-powered platform to automate the entire tour marketing lifecycle for music artists. The system consists of 7 specialized agents that work in a pipeline. The first agent (Tour Marketing) is partially built. The rest are designed but not yet implemented.

### What's in the zip file:

| File / Folder | What It Contains |
|:---|:---|
| `handoff_context.md` | **START HERE.** The complete project brief: all 7 agents, the architecture, the workflow pipeline, platform integrations, and the immediate priorities. |
| `implementation_guide.md` | Step-by-step instructions for the most urgent task: launching the Final Push ad campaign for the Lincoln, NE show (Feb 27, 2026). |
| `system_guide.md` | A plain-language guide explaining how agents, skills, and MCP tools work together. |
| `roadmap_update_1.md` | The phased build roadmap we agreed on. |
| `data/parsed_tour_data.md` | The full parsed tour schedule for DirtySnatcha's 2026 national tour (17 shows, Feb-Apr). |
| `data/example_analysis_complete.md` | Analysis of real-world example deliverables (Crankdat Atlanta campaign) that define our quality standard. |
| `data/MyShowsapp.xlsx` | Raw offer data from the booking platform. |
| `codebase/` | The scaffolded Python codebase for the Tour Marketing Agent, including skills and show data JSON files. |
| `skills/meta-ads-analyzer/` | The Meta Ads Analyzer skill with 9 reference documents for interpreting ad performance data. |
| `examples/` | Real-world examples: Crankdat Marketing Letter (PDF) and TMTYL Marketing Email (DOCX). These define the professional standard we are building toward. |
| `presentation/` | HTML slides for the full system architecture presentation. |

### What I need from you:

1. **Confirm you understand the 7-agent architecture** and how they work together in the pipeline.
2. **Confirm you see the tour data** and understand that Lincoln, NE (Feb 27) is the immediate priority.
3. **Review the Crankdat examples** in the `examples/` folder — these define our quality bar. Every deliverable our agents produce must match or exceed this standard.
4. **Tell me what's missing or unclear** before we start building.

### Key decisions already made:

- **Platforms:** Meta, TikTok, X, Snapchat, YouTube, Google Ads, Google Analytics, Email/SMS (Mailchimp or similar, with Laylo planned for the future).
- **Campaign Phases:** Every show follows a 4-phase system: Announcement (20% budget), On-Sale (20%), Maintenance (10%), Final Push (50%).
- **North Star Metric:** Cost Per Ticket Sold (CPT). Every dollar of ad spend must be traceable to ticket sales.
- **Build Order:** Agent 1 (Tour Marketing) → Agent 5 (Show Onboarding) → Agent 4 (Docs & Contracts) → Agent 3 (Asset Manager) → Agent 6 (Creative Production) → Agent 2 (Social Content) → Agent 7 (DSP Growth).
- **Quality Standard:** The Crankdat Atlanta Marketing Letter is our benchmark. Professional, data-driven, transparent.

### The immediate situation:

The DirtySnatcha show in **Lincoln, NE is TOMORROW (Feb 27, 2026)**. It is in the **Final Push** phase. We need to launch the ad campaign immediately. The `implementation_guide.md` has the step-by-step process.

Do NOT start building yet. Confirm your understanding first, then we'll proceed together.
