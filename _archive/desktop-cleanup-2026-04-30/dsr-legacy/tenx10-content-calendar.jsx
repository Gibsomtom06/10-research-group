import { useState, useMemo } from "react";

// ─── ARTIST CONFIG ────────────────────────────────────────────────────────────
const ARTISTS = {
  dirtysnatcha: { id: "dirtysnatcha", name: "DirtySnatcha", emoji: "🛸", color: "#00ff88", bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.25)" },
  whoisee:      { id: "whoisee",      name: "WHOiSEE",      emoji: "👁️",  color: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.25)" },
  darkmatter:   { id: "darkmatter",   name: "Dark Matter",  emoji: "🌌", color: "#06b6d4", bg: "rgba(6,182,212,0.08)",  border: "rgba(6,182,212,0.25)" },
  kotrax:       { id: "kotrax",       name: "Kotrax",       emoji: "⚡", color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)" },
};

const PLATFORM_COLORS = {
  "IG Feed":    "#e1306c", "IG Reel":   "#e1306c", "IG Story":  "#ff7043",
  "TikTok":     "#010101", "X":         "#1d9bf0",  "YouTube":   "#ff0000",
  "FB":         "#1877f2",
};

const TYPE_ICON = {
  "Feed Post": "🖼️", "Reel": "🎬", "Story": "📱", "TikTok": "🎵",
  "X Tweet": "𝕏", "YouTube Short": "▶️", "Multi-platform": "📡",
};

const PHASE_STYLE = {
  final_push:   { label: "🔴 FINAL PUSH",   color: "#ff4444", bg: "rgba(255,68,68,0.12)" },
  release:      { label: "🎵 RELEASE",       color: "#00ff88", bg: "rgba(0,255,136,0.12)" },
  tour_build:   { label: "🟡 TOUR BUILD",    color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  post_show:    { label: "🏁 POST-SHOW",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  branding:     { label: "⬜ BRANDING",      color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  maintenance:  { label: "🟢 MAINTENANCE",   color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  announcement: { label: "📢 ANNOUNCE",      color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  show_day:     { label: "⚡ SHOW DAY",      color: "#ff00ff", bg: "rgba(255,0,255,0.12)" },
};

// ─── CONTENT DATA ────────────────────────────────────────────────────────────
const POSTS = [

  // ═══════════════════════════════════════════════════════
  // DIRTYSNATCHA — WEEK 1 (Mar 3–7) ABQ FINAL PUSH + DITC
  // ═══════════════════════════════════════════════════════

  {
    id: "ds-001", artist: "dirtysnatcha", date: "2026-03-03", day: "Tue",
    platforms: ["IG Feed", "FB"], type: "Feed Post", phase: "final_push",
    priority: "red", time: "7:00 PM",
    caption: `ABQ THIS FRIDAY 🛸\n\nDirtySnatcha · Take Me To Your Leader Tour\nMarch 6 @ Effex — Albuquerque, NM\nw/ Mport · Kotrax · HVRCRFT\n\nif you're in New Mexico and you're not at this show idk what to tell you 👽🔥\n\ntickets → link in bio`,
    hashtags: "#dirtysnatcha #albuquerque #abq #newmexico #dubstep #bassmusic #riddim #takemetoyourleader #effexnightclub",
    assets: ["ABQ tour flyer (Effex branded)", "DirtySnatcha logo overlay"],
    cta: "Link in bio — tickets",
    notes: "3 days out. Pin this post. Tag @EffexNightclub @KotraxOfficial @MportOfficial",
  },
  {
    id: "ds-002", artist: "dirtysnatcha", date: "2026-03-03", day: "Tue",
    platforms: ["IG Story"], type: "Story", phase: "release",
    priority: "yellow", time: "9:00 AM",
    caption: `Drugs In Da Club — Day 5 🛸\n\nwe're in the algorithm window rn\ngo save this track and run it up 🔥\n\n[Spotify link sticker]`,
    hashtags: "",
    assets: ["Drugs In Da Club artwork", "Spotify save CTA graphic"],
    cta: "Save the track",
    notes: "Swipe-up to Spotify. Add music sticker with DITC playing. Keep it raw.",
  },
  {
    id: "ds-003", artist: "dirtysnatcha", date: "2026-03-04", day: "Wed",
    platforms: ["IG Story", "TikTok"], type: "TikTok", phase: "final_push",
    priority: "red", time: "6:00 PM",
    caption: `ABQ in 2 days 👽🔥 Effex nightclub is about to get absolutely destroyed. Mport, Kotrax, HVRCRFT on the bill. PLAY SOME F*CKING DUBSTEP ‼️\n\n#albuquerque #abq #dubstep #dirtysnatcha #bassmusic #riddim`,
    hashtags: "#albuquerque #abq #dubstep #dirtysnatcha #bassmusic #riddim",
    assets: ["Talking head selfie video (30s)", "ABQ flyer B-roll overlay"],
    cta: "Tickets in bio",
    notes: "Talking head. Hook in first 2 seconds: 'ABQ in 2 DAYS.' Show energy. Casual, not scripted.",
  },
  {
    id: "ds-004", artist: "dirtysnatcha", date: "2026-03-05", day: "Thu",
    platforms: ["IG Story"], type: "Story", phase: "final_push",
    priority: "red", time: "10:00 AM",
    caption: `TOMORROW. ABQ. 🛸\n\nthe aliens are landing at Effex\n\n[Poll sticker: "You pulling up?" 🛸 YES / 👀 watching from home]`,
    hashtags: "",
    assets: ["ABQ countdown graphic (1 day)", "Alien UFO animation or sticker"],
    cta: "Poll engagement + ticket link",
    notes: "3-slide story series. Slide 1: countdown. Slide 2: lineup graphic. Slide 3: ticket link.",
  },
  {
    id: "ds-005", artist: "dirtysnatcha", date: "2026-03-05", day: "Thu",
    platforms: ["X"], type: "X Tweet", phase: "final_push",
    priority: "red", time: "6:00 PM",
    caption: `ABQ TOMORROW 🛸🔥\n@EffexNightclub w/ @MportOfficial @KotraxOfficial @HVRCRFT\n\nPLAY SOME F*CKING DUBSTEP ‼️\n\ntickets → [link]`,
    hashtags: "",
    assets: ["ABQ flyer (square format)"],
    cta: "Ticket link in tweet",
    notes: "Tag venue and all support artists. Short. Direct.",
  },
  {
    id: "ds-006", artist: "dirtysnatcha", date: "2026-03-06", day: "Fri",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "10:00 AM",
    caption: `ALBUQUERQUE WE'RE PULLING UP 🛸👽\n\n[travel/airport BTS photo or video]\n\ntonight @ Effex — few tickets left at the door`,
    hashtags: "",
    assets: ["Phone camera — travel BTS", "Airport/car/road content"],
    cta: "At-door tickets tonight",
    notes: "Raw phone content all day. Travel → soundcheck → green room → show. Stories every 2-3 hours.",
  },
  {
    id: "ds-007", artist: "dirtysnatcha", date: "2026-03-06", day: "Fri",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "8:00 PM",
    caption: `TONIGHT. EFFEX. ABQ. 🛸🔥\n\nwe are HERE\n\n[ticket link sticker]`,
    hashtags: "",
    assets: ["Hype graphic — TONIGHT", "Venue exterior or sound check clip"],
    cta: "Tickets at door",
    notes: "Post right before doors open. Keep energy high.",
  },
  {
    id: "ds-008", artist: "dirtysnatcha", date: "2026-03-07", day: "Sat",
    platforms: ["IG Reel", "TikTok", "YouTube"], type: "Reel", phase: "post_show",
    priority: "red", time: "2:00 PM",
    caption: `ABQ WENT ABSOLUTELY CRAZY 🔥🔥🔥\n\nEffex + DirtySnatcha + the whole crew = insanity 👽\n\nthank you Albuquerque. we're not done 🛸\n\n#dirtysnatcha #albuquerque #abq #dubstep #bassmusic #effex #takemetoyourleader`,
    hashtags: "#dirtysnatcha #albuquerque #abq #dubstep #bassmusic #effex #takemetoyourleader",
    assets: ["Best crowd moments (10-30s edit)", "Drop highlight with DITC or set audio", "Crowd reaction clips"],
    cta: "Tag someone who was there",
    notes: "Fast-cut edit. Best bass drop moment as the hook. Use show footage shot during set.",
  },
  {
    id: "ds-009", artist: "dirtysnatcha", date: "2026-03-07", day: "Sat",
    platforms: ["IG Feed", "FB"], type: "Feed Post", phase: "post_show",
    priority: "yellow", time: "4:00 PM",
    caption: `ABQ 🛸🔥\n\nEffex went crazy last night. thank you to everyone who pulled up — that energy was absolutely insane 🙏\n\nMport + Kotrax + HVRCRFT killed it. this lineup does not miss.\n\nnext up → TAMPA + PITTSBURGH. see you soon 👽`,
    hashtags: "#dirtysnatcha #albuquerque #liveshow #dubstep #riddim #bassmusic #takemetoyourleader",
    assets: ["Best show photo (crowd or stage shot)", "Post-show energy photo"],
    cta: "Tag your crew from last night",
    notes: "Best photo from the show. Warm, grateful energy. Drop next shows in caption.",
  },

  // ═══════════════════════════════════════════════════════
  // DIRTYSNATCHA — WEEK 2 (Mar 8–14) DITC PUSH + TAMPA/PGH
  // ═══════════════════════════════════════════════════════

  {
    id: "ds-010", artist: "dirtysnatcha", date: "2026-03-08", day: "Sun",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "release",
    priority: "red", time: "12:00 PM",
    caption: `Drugs In Da Club — go run this up 🛸🔥\n\nthis track is on another level and you already know it 👽\n\nsave it. add it to your playlist. blast it at 3am. you're welcome.\n\nlink in bio → Spotify`,
    hashtags: "#dirtysnatcha #drugsindaclub #dubstep #bassmusic #riddim #newmusic",
    assets: ["DITC audio (30s clip with drop)", "Studio session visual or dark neon aesthetic clip", "Track artwork animation"],
    cta: "Save the track — link in bio",
    notes: "Day 10 — algorithm window closing. This is the last high-priority organic push before Marquee campaign takes over. Make it hit.",
  },
  {
    id: "ds-011", artist: "dirtysnatcha", date: "2026-03-09", day: "Mon",
    platforms: ["IG Feed", "FB", "X"], type: "Feed Post", phase: "tour_build",
    priority: "red", time: "7:00 PM",
    caption: `FLORIDA 🛸🌴\n\nDirtySnatcha Take Me To Your Leader Tour\nMarch 13 @ Tampa\nw/ Kotrax · Mport · HVRCRFT\n\nSpring Break just got a whole lot heavier 👽🔥\n\ntickets → link in bio`,
    hashtags: "#dirtysnatcha #tampa #florida #dubstep #bassmusic #riddim #springbreak #springbreak2026 #tampabass #takemetoyourleader",
    assets: ["Tampa tour flyer", "Spring break themed graphic (beach + bass)"],
    cta: "Link in bio — tickets",
    notes: "Venue TBD — use city name only until venue confirmed. Tag Tampa promo groups in comments.",
  },
  {
    id: "ds-012", artist: "dirtysnatcha", date: "2026-03-09", day: "Mon",
    platforms: ["IG Feed", "FB", "X"], type: "Feed Post", phase: "tour_build",
    priority: "red", time: "9:00 PM",
    caption: `PITTSBURGH 🛸🔥\n\nDirtySnatcha · Take Me To Your Leader Tour\nMarch 14 @ SideQuest, Pittsburgh PA\nw/ WHOiSEE · Dark Matter\n\nSideQuest is not ready for what we're bringing 👽\n\ntickets → link in bio`,
    hashtags: "#dirtysnatcha #pittsburgh #pennsylvania #dubstep #bassmusic #riddim #sidequest #whoisee #darkmatter #takemetoyourleader",
    assets: ["Pittsburgh tour flyer (SideQuest branded)", "WHOiSEE + Dark Matter collab graphic"],
    cta: "Link in bio — tickets",
    notes: "Tag @SideQuestPGH @WHOiSEE @DarkMatterOfficial. Separate post from Tampa — different markets.",
  },
  {
    id: "ds-013", artist: "dirtysnatcha", date: "2026-03-11", day: "Wed",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "final_push",
    priority: "red", time: "6:00 PM",
    caption: `Spring Break but make it dubstep 🌴👽🔥\n\nTampa · March 13\nDirtySnatcha + Kotrax + Mport + HVRCRFT\n\nthis is not your average spring break party 🛸\n\nlink in bio\n\n#tampa #springbreak #dubstep #bassmusic #dirtysnatcha #floridabass`,
    hashtags: "#tampa #springbreak #dubstep #bassmusic #dirtysnatcha #floridabass #springbreak2026",
    assets: ["Hype energy reel — beach + bass mashup aesthetic (15s)", "DITC audio overlay", "Tampa show graphic B-roll"],
    cta: "Tickets in bio",
    notes: "Hook: 'Spring Break just got heavier.' Use DITC as background audio. Fast cuts.",
  },
  {
    id: "ds-014", artist: "dirtysnatcha", date: "2026-03-11", day: "Wed",
    platforms: ["IG Story"], type: "Story", phase: "final_push",
    priority: "red", time: "8:00 PM",
    caption: `PITTSBURGH SATURDAY 🛸\nWHOiSEE + Dark Matter on the bill\nSideQuest is going to go absolutely crazy\n\n[ticket link sticker]`,
    hashtags: "",
    assets: ["Pittsburgh lineup graphic", "WHOiSEE + Dark Matter artist photos"],
    cta: "Ticket link sticker",
    notes: "Support artist hype story. Tag both artists.",
  },
  {
    id: "ds-015", artist: "dirtysnatcha", date: "2026-03-12", day: "Thu",
    platforms: ["IG Story", "TikTok", "X"], type: "Multi-platform", phase: "final_push",
    priority: "red", time: "6:00 PM",
    caption: `TAMPA TOMORROW. PITTSBURGH SATURDAY.\n\nthe aliens don't stop 🛸🔥\n\nFL → PA back to back. if you know you know 👽`,
    hashtags: "",
    assets: ["Double show split graphic (Tampa / Pittsburgh)", "Map route visual"],
    cta: "Tickets both shows — link in bio",
    notes: "X version: 'FL TOMORROW. PGH SATURDAY. the aliens don't stop 🛸' — text only works on X.",
  },
  {
    id: "ds-016", artist: "dirtysnatcha", date: "2026-03-13", day: "Fri",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "10:00 AM",
    caption: `TAMPA WE ARE PULLING UP 🛸🌴\n\n[travel BTS — Florida arrival]\n\nSpring Break dubstep invasion TONIGHT 👽🔥`,
    hashtags: "",
    assets: ["Phone BTS — travel to Tampa", "Florida arrival content"],
    cta: "Tonight — door tickets",
    notes: "Raw phone content. Florida arrival energy. Keep it real.",
  },
  {
    id: "ds-017", artist: "dirtysnatcha", date: "2026-03-14", day: "Sat",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "post_show",
    priority: "red", time: "12:00 PM",
    caption: `TAMPA 🌴🔥\n\nSpring Break dubstep invasion successful 👽\n\nthank you Florida — you already know how we do 🛸\n\nPITTSBURGH TONIGHT. SideQuest. let's go 🔥`,
    hashtags: "#dirtysnatcha #tampa #florida #dubstep #bassmusic #springbreak #takemetoyourleader",
    assets: ["Tampa show best moments (15-30s)", "DITC or set audio"],
    cta: "Pittsburgh tonight — last tickets",
    notes: "Double duty post — Tampa recap AND Pittsburgh TONIGHT tease. Keep it tight.",
  },
  {
    id: "ds-018", artist: "dirtysnatcha", date: "2026-03-14", day: "Sat",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "8:00 PM",
    caption: `PITTSBURGH. TONIGHT. SIDEQUEST. 🛸🔥\n\njust got off the plane. heading to soundcheck.\nWHOiSEE + Dark Matter are ready.\n\n[ticket link sticker]`,
    hashtags: "",
    assets: ["Pittsburgh soundcheck or travel BTS", "TONIGHT graphic"],
    cta: "Last tickets — door",
    notes: "Post from Pittsburgh. Straight from Tampa travel to Pittsburgh show. Raw energy.",
  },
  {
    id: "ds-019", artist: "dirtysnatcha", date: "2026-03-15", day: "Sun",
    platforms: ["IG Reel", "TikTok", "YouTube"], type: "Reel", phase: "post_show",
    priority: "yellow", time: "2:00 PM",
    caption: `PITTSBURGH WENT ABSOLUTELY CRAZY 🔥🔥🔥\n\nSideQuest + WHOiSEE + Dark Matter = insanity 👽\n\nback to back Tampa + Pittsburgh weekend. that's how we do it 🛸\n\nthank you both cities 🙏`,
    hashtags: "#dirtysnatcha #pittsburgh #sidequest #whoisee #darkmatter #dubstep #bassmusic #takemetoyourleader",
    assets: ["Pittsburgh best moments (crowd, drop, stage)", "Set audio highlight"],
    cta: "Tag your crew from last night",
    notes: "Best show footage. Energy-focused edit. Under 30 seconds.",
  },

  // ═══════════════════════════════════════════════════════
  // DIRTYSNATCHA — WEEK 3 (Mar 16–21) RECOVERY + LINCOLN
  // ═══════════════════════════════════════════════════════

  {
    id: "ds-020", artist: "dirtysnatcha", date: "2026-03-16", day: "Mon",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "branding",
    priority: "yellow", time: "6:00 PM",
    caption: `always working 🛸\n\nnew music in the lab. can't say too much yet 👽\n\n#dirtysnatcha #dubstep #bassmusic #studiolife #newmusic`,
    hashtags: "#dirtysnatcha #dubstep #bassmusic #studiolife #newmusic #riddim",
    assets: ["DAW screenshot or screen record (Ableton/FL Studio)", "Studio session B-roll", "WIP track teaser audio (15s)"],
    cta: "Follow so you don't miss the drop",
    notes: "Recovery week. Show artist is always working. Don't reveal specific release.",
  },
  {
    id: "ds-021", artist: "dirtysnatcha", date: "2026-03-17", day: "Tue",
    platforms: ["IG Story"], type: "Story", phase: "release",
    priority: "yellow", time: "10:00 AM",
    caption: `Drugs In Da Club stream update 📊\n\n[share actual stream count graphic]\n\nyall ran this up and we appreciate every single one of you 🙏🛸\n\nkeep saving. keep sharing.`,
    hashtags: "",
    assets: ["Spotify for Artists streams screenshot", "Stats graphic template"],
    cta: "Save the track",
    notes: "Transparency post performs well. Real numbers. Pull from Spotify for Artists.",
  },
  {
    id: "ds-022", artist: "dirtysnatcha", date: "2026-03-18", day: "Wed",
    platforms: ["IG Feed", "FB"], type: "Feed Post", phase: "branding",
    priority: "yellow", time: "7:00 PM",
    caption: `tour life 🛸\n\n[best tour photo — candid or behind the scenes]\n\nthis is what we do 👽🔥`,
    hashtags: "#dirtysnatcha #tourlife #dubstep #bassmusic #riddim #takemetoyourleader #tourlife2026",
    assets: ["Best candid tour photo (travel, backstage, pre-show)", "Natural light or moody aesthetic"],
    cta: "Where should we come next?",
    notes: "Engagement question in caption drives comments. Evergreen branding content.",
  },
  {
    id: "ds-023", artist: "dirtysnatcha", date: "2026-03-19", day: "Thu",
    platforms: ["IG Feed", "FB", "X"], type: "Feed Post", phase: "announcement",
    priority: "red", time: "7:00 PM",
    caption: `LOUISVILLE + COVINGTON 🛸🔥\n\nKentucky — we're coming for you\n\nMarch 27 · Louisville KY\nMarch 28 · Covington KY\n\nback to back Kentucky nights 👽\n\ntickets → link in bio`,
    hashtags: "#dirtysnatcha #louisville #covington #kentucky #dubstep #bassmusic #riddim #takemetoyourleader",
    assets: ["KY double show flyer", "Louisville + Covington graphic"],
    cta: "Link in bio — tickets",
    notes: "Announce both KY shows together. Keep the momentum from Tampa/PGH.",
  },
  {
    id: "ds-024", artist: "dirtysnatcha", date: "2026-03-21", day: "Sat",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "10:00 AM",
    caption: `LINCOLN NE TODAY 🛸\n\npulling up to the Royal Grove\n\ntonight is going to be absolutely insane 🔥👽`,
    hashtags: "",
    assets: ["Travel to Lincoln BTS", "Royal Grove venue graphic"],
    cta: "Tonight — tickets at door",
    notes: "Lincoln show. Stories throughout the day — travel, soundcheck, show.",
  },

  // ═══════════════════════════════════════════════════════
  // DIRTYSNATCHA — WEEK 4 (Mar 22–28) KY DOUBLE HEADER
  // ═══════════════════════════════════════════════════════

  {
    id: "ds-025", artist: "dirtysnatcha", date: "2026-03-23", day: "Mon",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "tour_build",
    priority: "red", time: "6:00 PM",
    caption: `the tour is not slowing down 🛸🔥\n\nLouisville this Friday. Covington this Saturday.\n\nKentucky — we're pulling up 👽\n\n#louisville #covington #kentucky #dubstep #dirtysnatcha`,
    hashtags: "#louisville #covington #kentucky #dubstep #dirtysnatcha #bassmusic #takemetoyourleader",
    assets: ["Tour highlight clip (best moments from ABQ/Tampa/PGH)", "DITC audio overlay"],
    cta: "Tickets in bio",
    notes: "Use ABQ/Tampa/PGH best moments as B-roll. Hype reel driving KY ticket sales.",
  },
  {
    id: "ds-026", artist: "dirtysnatcha", date: "2026-03-25", day: "Wed",
    platforms: ["IG Story", "TikTok"], type: "Story", phase: "final_push",
    priority: "red", time: "7:00 PM",
    caption: `LOUISVILLE FRIDAY. COVINGTON SATURDAY. 🛸🔥\n\nback to back Kentucky nights\n\nwe are NOT slowing down 👽\n\n[ticket link sticker]`,
    hashtags: "",
    assets: ["KY double header graphic (split design)", "Countdown element"],
    cta: "Tickets both nights — link in bio",
    notes: "Double countdown. 2 shows 2 days. Drive both ticket links.",
  },
  {
    id: "ds-027", artist: "dirtysnatcha", date: "2026-03-27", day: "Fri",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "9:00 AM",
    caption: `LOUISVILLE TODAY 🛸🔥\n\npulling up to Kentucky\n\ntonight we go crazy 👽`,
    hashtags: "",
    assets: ["Travel BTS to Louisville", "TONIGHT graphic"],
    cta: "Door tickets tonight",
    notes: "Game day stories throughout the day.",
  },
  {
    id: "ds-028", artist: "dirtysnatcha", date: "2026-03-28", day: "Sat",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "post_show",
    priority: "red", time: "12:00 PM",
    caption: `LOUISVILLE 🔥🔥\n\nKentucky went absolutely crazy last night 👽\n\nCOVINGTON TONIGHT. round 2. 🛸\n\nKY double header. that's how we do it.`,
    hashtags: "#dirtysnatcha #louisville #kentucky #dubstep #bassmusic",
    assets: ["Louisville show best moments", "Quick edit for same-day turnaround"],
    cta: "Covington TONIGHT — last tickets",
    notes: "Fast turnaround — post Louisville recap AND push Covington show same day.",
  },

  // ═══════════════════════════════════════════════════════
  // DIRTYSNATCHA — APRIL SHOWS BUILD
  // ═══════════════════════════════════════════════════════

  {
    id: "ds-029", artist: "dirtysnatcha", date: "2026-03-31", day: "Tue",
    platforms: ["IG Feed", "FB", "X"], type: "Feed Post", phase: "announcement",
    priority: "red", time: "7:00 PM",
    caption: `LAS VEGAS 🛸🎰\n\nDirtySnatcha · Take Me To Your Leader Tour\nApril 3 @ Ravehouse — Las Vegas NV\n\nVegas. Aliens. Dubstep. you already know 👽🔥\n\nDancefestopia tie-in. this one is different.\n\ntickets → link in bio`,
    hashtags: "#dirtysnatcha #lasvegas #vegas #nevada #dubstep #bassmusic #riddim #ravehouse #takemetoyourleader",
    assets: ["Las Vegas tour flyer (Ravehouse branded)", "Vegas neon aesthetic graphic"],
    cta: "Link in bio — tickets",
    notes: "Announce by contract deadline. Dancefestopia tie-in is a major hook — use it.",
  },
  {
    id: "ds-030", artist: "dirtysnatcha", date: "2026-04-01", day: "Wed",
    platforms: ["IG Feed", "FB", "X"], type: "Feed Post", phase: "announcement",
    priority: "red", time: "7:00 PM",
    caption: `DENVER 🏔️🛸\n\nDirtySnatcha · Take Me To Your Leader Tour\nApril 9 @ Larimer Lounge — Denver CO\n\nSub.mission fam — this is for you 👽🔥\n\none of the best bass markets in the country. let's go crazy.\n\ntickets → link in bio`,
    hashtags: "#dirtysnatcha #denver #colorado #dubstep #bassmusic #riddim #larimerloungedenver #submission #takemetoyourleader",
    assets: ["Denver tour flyer (Larimer Lounge branded)", "Mountain + bass aesthetic"],
    cta: "Link in bio — tickets",
    notes: "Denver is top-3 bass market. Sub.mission community shoutout is key. Expected sellout.",
  },
  {
    id: "ds-031", artist: "dirtysnatcha", date: "2026-04-05", day: "Sun",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "10:00 AM",
    caption: `LAS VEGAS TONIGHT 🛸🎰\n\nthe aliens have landed in Nevada 👽\n\nRavehouse. tonight. let's get it 🔥`,
    hashtags: "",
    assets: ["Vegas arrival BTS", "Ravehouse venue graphic"],
    cta: "Tonight — Ravehouse",
    notes: "Show day stories. Vegas arrival, soundcheck, pre-show.",
  },
  {
    id: "ds-032", artist: "dirtysnatcha", date: "2026-04-07", day: "Tue",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "post_show",
    priority: "yellow", time: "2:00 PM",
    caption: `Vegas did NOT disappoint 🛸🎰🔥\n\nRavehouse went absolutely crazy 👽\n\nDENVER IN 2 DAYS. Larimer Lounge. Sub.mission fam — we are COMING 🏔️\n\n#lasvegas #dirtysnatcha #dubstep #ravehouse`,
    hashtags: "#lasvegas #dirtysnatcha #dubstep #ravehouse #bassmusic",
    assets: ["Vegas show best moments", "DITC or set audio"],
    cta: "Denver — get your tickets now",
    notes: "Vegas recap + Denver 2-day push in same post.",
  },
  {
    id: "ds-033", artist: "dirtysnatcha", date: "2026-04-09", day: "Thu",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "11:00 AM",
    caption: `DENVER TODAY 🏔️🛸\n\nLarimer Lounge. Sub.mission fam.\n\nthis might be my favorite show on the tour 👽🔥\n\nPLAY SOME F*CKING DUBSTEP ‼️`,
    hashtags: "",
    assets: ["Denver arrival BTS", "Mountain/Denver aesthetic"],
    cta: "Larimer Lounge tonight",
    notes: "Denver is high-probability sellout. Hype this appropriately. Show appreciation for the market.",
  },

  // ═══════════════════════════════════════════════════════
  // DIRTYSNATCHA — BRANDING / EVERGREEN (ongoing)
  // ═══════════════════════════════════════════════════════

  {
    id: "ds-034", artist: "dirtysnatcha", date: "2026-03-24", day: "Tue",
    platforms: ["IG Feed"], type: "Feed Post", phase: "branding",
    priority: "yellow", time: "7:00 PM",
    caption: `PLAY SOME F*CKING DUBSTEP ‼️\n\n[alien meme or brand graphic]\n\nyou know the assignment 🛸👽🔥`,
    hashtags: "#dirtysnatcha #dubstep #bassmusic #playsomedubstep #alien #riddim",
    assets: ["PLAY SOME F*CKING DUBSTEP brand graphic", "Alien artwork or meme"],
    cta: "Tag someone who needs this",
    notes: "Evergreen brand post. Reinforces catchphrase. High shareability.",
  },
  {
    id: "ds-035", artist: "dirtysnatcha", date: "2026-04-14", day: "Tue",
    platforms: ["IG Feed", "FB", "X"], type: "Feed Post", phase: "announcement",
    priority: "red", time: "7:00 PM",
    caption: `BUTTE MONTANA 🏔️🛸\n\nDirtySnatcha · Take Me To Your Leader Tour\nMay 2 @ Covellite Theatre — Butte MT\nMAD Series presents\n\nMontana — the aliens are coming for you 👽🔥\n\ntickets → link in bio`,
    hashtags: "#dirtysnatcha #butte #montana #covellitetheatre #madseries #dubstep #bassmusic #takemetoyourleader",
    assets: ["Butte/Montana tour flyer (Covellite branded)", "Mountain alien concept graphic"],
    cta: "Link in bio — tickets",
    notes: "$5K guarantee. MAD Series. High-probability sellout. Montana alien angle = shareable.",
  },

  // ═══════════════════════════════════════════════════════
  // WHOISEE — WEEK 1 (Mar 3–10) "GET DOWN" RELEASE
  // ═══════════════════════════════════════════════════════

  {
    id: "ws-001", artist: "whoisee", date: "2026-03-04", day: "Wed",
    platforms: ["IG Feed", "X", "TikTok"], type: "Multi-platform", phase: "release",
    priority: "red", time: "12:00 PM",
    caption: `Get Down — out now 👁️\n\nKannibalen Records\n\nif you know, you know.\n\n[Spotify link in bio]`,
    hashtags: "#whoisee #getdown #kannibalen #dubstep #bassmusic #newmusic",
    assets: ["Get Down artwork (Kannibalen branded)", "30s audio preview clip"],
    cta: "Stream now — link in bio",
    notes: "Release day. Clean and confident. WHOiSEE voice = minimal, mysterious. Not hype-screaming.",
  },
  {
    id: "ws-002", artist: "whoisee", date: "2026-03-04", day: "Wed",
    platforms: ["IG Story"], type: "Story", phase: "release",
    priority: "red", time: "9:00 AM",
    caption: `it's out 👁️\n\nGet Down · Kannibalen Records\n\n[Music sticker + Spotify link]`,
    hashtags: "",
    assets: ["Get Down artwork", "Music link sticker"],
    cta: "Stream + save",
    notes: "First story of release day. Simple. Let the music speak.",
  },
  {
    id: "ws-003", artist: "whoisee", date: "2026-03-05", day: "Thu",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "release",
    priority: "red", time: "6:00 PM",
    caption: `Get Down — Kannibalen Records 👁️🔥\n\nthis one hits different. go save it.\n\n#whoisee #getdown #dubstep #bassmusic #kannibalen`,
    hashtags: "#whoisee #getdown #dubstep #bassmusic #kannibalen #newmusic",
    assets: ["Get Down audio (drop moment, 15-30s)", "Dark neon visual / lyric animation", "Track artwork motion graphic"],
    cta: "Save the track",
    notes: "Day 2. Hook with the drop. Dark aesthetic matches WHOiSEE brand.",
  },
  {
    id: "ws-004", artist: "whoisee", date: "2026-03-07", day: "Sat",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "release",
    priority: "yellow", time: "4:00 PM",
    caption: `Magic — if you haven't heard this yet 👁️\n\ngo find it. you're welcome.\n\n#whoisee #magic #dubstep #bassmusic`,
    hashtags: "#whoisee #magic #dubstep #bassmusic #riddim #basshouse",
    assets: ["Magic audio (drop or melodic moment)", "Dark atmospheric visual", "Track art"],
    cta: "Save Magic — link in bio",
    notes: "Magic awareness push. 12K streams organic — needs save ratio boost. No Marquee yet — organic first.",
  },
  {
    id: "ws-005", artist: "whoisee", date: "2026-03-10", day: "Tue",
    platforms: ["IG Story"], type: "Story", phase: "release",
    priority: "yellow", time: "9:00 AM",
    caption: `Get Down — week 1 📊\n\n[stream count graphic]\n\nthank you 👁️\n\nmore coming.`,
    hashtags: "",
    assets: ["Get Down stream stats graphic", "Kannibalen collab logo"],
    cta: "Keep streaming",
    notes: "Transparency post. Real numbers if available. Keep it understated.",
  },
  {
    id: "ws-006", artist: "whoisee", date: "2026-03-14", day: "Sat",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "9:00 PM",
    caption: `Pittsburgh 🏙️\n\nsupporting DirtySnatcha tonight @ SideQuest\n\nthis lineup is 🔥\n\n[BTS pre-show]`,
    hashtags: "",
    assets: ["SideQuest pre-show BTS", "WHOiSEE on stage or soundcheck"],
    cta: "Watch the stories",
    notes: "WHOiSEE supporting DS at Pittsburgh. Document the show. Cross-promote with DS posts.",
  },
  {
    id: "ws-007", artist: "whoisee", date: "2026-03-17", day: "Tue",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "release",
    priority: "yellow", time: "6:00 PM",
    caption: `if you haven't saved This Is It yet 👁️\n\nyou should probably do that.\n\n#whoisee #dubstep #bassmusic`,
    hashtags: "#whoisee #dubstep #bassmusic #thisisit #newartist #basshouse",
    assets: ["This Is It audio (hook/drop moment)", "Dark minimal visual", "Track artwork"],
    cta: "Save — link in bio",
    notes: "Hidden gem spotlight. This Is It has 10.9% save ratio. Needs more exposure. Spotlight posts work.",
  },
  {
    id: "ws-008", artist: "whoisee", date: "2026-03-21", day: "Sat",
    platforms: ["IG Feed"], type: "Feed Post", phase: "branding",
    priority: "yellow", time: "5:00 PM",
    caption: `👁️\n\nif you know, you know.`,
    hashtags: "#whoisee #dubstep #bassmusic #iykyk",
    assets: ["WHOiSEE logo or eye graphic (minimal, dark aesthetic)", "Brand identity visual"],
    cta: "Follow for more",
    notes: "Mystery branding post. Minimal = on brand. No explanation needed. High-save post type.",
  },
  {
    id: "ws-009", artist: "whoisee", date: "2026-03-28", day: "Sat",
    platforms: ["IG Feed", "X"], type: "Feed Post", phase: "announcement",
    priority: "yellow", time: "6:00 PM",
    caption: `Circus Records EP 👁️\n\nsomething's coming.\n\nmore soon.`,
    hashtags: "#whoisee #circusrecords #dubstep #bassmusic #ep",
    assets: ["Teaser graphic — WHOiSEE x Circus Records", "Minimal dark aesthetic"],
    cta: "Follow to be first",
    notes: "Soft tease of Circus Records UK EP deal. Don't over-announce. Mystery is the brand.",
  },
  {
    id: "ws-010", artist: "whoisee", date: "2026-04-07", day: "Tue",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "release",
    priority: "yellow", time: "6:00 PM",
    caption: `Prime Time — go run it up 👁️🔥\n\n7.6% save ratio says you already know what this is\n\ngo save it.\n\n#whoisee #primetime #dubstep #bassmusic`,
    hashtags: "#whoisee #primetime #dubstep #bassmusic #basshouse",
    assets: ["Prime Time audio (drop, 15-30s)", "Dark visual edit", "Track art"],
    cta: "Save now — link in bio",
    notes: "Prime Time = 2,113 streams + 7.6% SR. Best combination in catalog after Magic. Push it.",
  },

  // ═══════════════════════════════════════════════════════
  // DARK MATTER — MARCH/APRIL
  // ═══════════════════════════════════════════════════════

  {
    id: "dm-001", artist: "darkmatter", date: "2026-03-08", day: "Sun",
    platforms: ["IG Feed", "X"], type: "Feed Post", phase: "branding",
    priority: "yellow", time: "6:00 PM",
    caption: `Heavy. Dark. Real. 🌌\n\nif you're not on this yet — you should be.\n\n#darkmatter #dubstep #bassmusic #wakaan #heavy`,
    hashtags: "#darkmatter #dubstep #bassmusic #wakaan #heavy #basshouse #riddimdubstep",
    assets: ["Dark Matter brand graphic (dark, cinematic aesthetic)", "Dark Matter logo on black"],
    cta: "Follow + save the catalog",
    notes: "Brand awareness. Dark Matter voice = heavy, minimal, artistic. Not hype-screaming.",
  },
  {
    id: "dm-002", artist: "darkmatter", date: "2026-03-14", day: "Sat",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "9:00 PM",
    caption: `Pittsburgh tonight 🌌\n\nsupporting DirtySnatcha @ SideQuest\n\nwe are ready.\n\n[soundcheck BTS]`,
    hashtags: "",
    assets: ["Pittsburgh soundcheck BTS", "SideQuest venue graphic"],
    cta: "Watch the show",
    notes: "Supporting DS/WHOiSEE at Pittsburgh. Cross-post with DirtySnatcha content.",
  },
  {
    id: "dm-003", artist: "darkmatter", date: "2026-03-20", day: "Fri",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "release",
    priority: "red", time: "6:00 PM",
    caption: `Wakaan. 🌌\n\nif you know the label, you know what this means.\n\ngo stream it.\n\n#darkmatter #wakaan #liquidstranger #dubstep #bassmusic`,
    hashtags: "#darkmatter #wakaan #liquidstranger #dubstep #bassmusic #heavy",
    assets: ["Wakaan release audio (30s drop)", "Dark cinematic visual", "Wakaan collab artwork"],
    cta: "Stream — link in bio",
    notes: "Wakaan release is the biggest credibility marker for Dark Matter. Lead with the label name.",
  },
  {
    id: "dm-004", artist: "darkmatter", date: "2026-04-01", day: "Wed",
    platforms: ["IG Feed"], type: "Feed Post", phase: "branding",
    priority: "yellow", time: "7:00 PM",
    caption: `Chicago roots. Knoxville energy. 🌌\n\nalways in the lab. always heavy.\n\n#darkmatter #chicago #knoxville #dubstep #bassmusic #studiolife`,
    hashtags: "#darkmatter #chicago #knoxville #dubstep #bassmusic #studiolife",
    assets: ["Dark Matter studio or city photo (cinematic)", "Chicago/Knoxville aesthetic"],
    cta: "Follow the journey",
    notes: "Identity/origin post. Shows roots. Builds connection.",
  },
  {
    id: "dm-005", artist: "darkmatter", date: "2026-04-15", day: "Wed",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "branding",
    priority: "yellow", time: "6:00 PM",
    caption: `the heaviest music you'll hear today 🌌\n\nDark Matter. save the catalog.\n\n#darkmatter #dubstep #bassmusic #heavy`,
    hashtags: "#darkmatter #dubstep #bassmusic #heavy #wakaan",
    assets: ["Dark Matter best track drop compilation (30s)", "Dark cinematic video edit"],
    cta: "Save — link in bio",
    notes: "Catalog awareness reel. Drive saves across full catalog.",
  },

  // ═══════════════════════════════════════════════════════
  // KOTRAX — MARCH/APRIL
  // ═══════════════════════════════════════════════════════

  {
    id: "kt-001", artist: "kotrax", date: "2026-03-03", day: "Tue",
    platforms: ["IG Feed", "X"], type: "Feed Post", phase: "branding",
    priority: "yellow", time: "6:00 PM",
    caption: `bass music. no compromise. ⚡\n\n#kotrax #bassmusic #dubstep #riddim`,
    hashtags: "#kotrax #bassmusic #dubstep #riddim #dirtysnatcharecords",
    assets: ["Kotrax brand graphic (electric, high-energy aesthetic)", "Logo on dark background"],
    cta: "Follow — catalog in bio",
    notes: "Brand statement post. Simple. Kotrax voice = direct, no fluff.",
  },
  {
    id: "kt-002", artist: "kotrax", date: "2026-03-06", day: "Fri",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "9:00 PM",
    caption: `Albuquerque TONIGHT ⚡\n\nsupporting DirtySnatcha @ Effex\n\nwe are READY 🔥\n\n[soundcheck BTS]`,
    hashtags: "",
    assets: ["ABQ soundcheck BTS", "Effex venue graphic"],
    cta: "Come out tonight",
    notes: "Support on DS ABQ show. Cross-promote with DirtySnatcha content.",
  },
  {
    id: "kt-003", artist: "kotrax", date: "2026-03-09", day: "Mon",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "post_show",
    priority: "yellow", time: "2:00 PM",
    caption: `Albuquerque was 🔥⚡\n\nEffex + DirtySnatcha + the whole crew\n\nthank you ABQ. back for more soon.\n\n#kotrax #albuquerque #dubstep #bassmusic`,
    hashtags: "#kotrax #albuquerque #abq #dubstep #bassmusic #dirtysnatcha",
    assets: ["ABQ show moments (stage or crowd)", "Set clip"],
    cta: "Follow Kotrax",
    notes: "ABQ recap from Kotrax perspective.",
  },
  {
    id: "kt-004", artist: "kotrax", date: "2026-03-13", day: "Fri",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "9:00 PM",
    caption: `Tampa TONIGHT ⚡🌴\n\nSpring Break dubstep with DirtySnatcha\n\nlet's get it 🔥`,
    hashtags: "",
    assets: ["Tampa soundcheck or arrival BTS"],
    cta: "Tonight in Tampa",
    notes: "Support on DS Tampa show.",
  },
  {
    id: "kt-005", artist: "kotrax", date: "2026-03-18", day: "Wed",
    platforms: ["IG Reel", "TikTok"], type: "Reel", phase: "release",
    priority: "red", time: "6:00 PM",
    caption: `go save the catalog ⚡\n\n7 tracks. all fire. no filler.\n\nKotrax · DirtySnatcha Records\n\n#kotrax #bassmusic #dubstep #dirtysnatcharecords`,
    hashtags: "#kotrax #bassmusic #dubstep #dirtysnatcharecords #riddim",
    assets: ["Kotrax catalog highlight reel (best drops, 30s)", "DSR logo + Kotrax branding"],
    cta: "Save the catalog — link in bio",
    notes: "Drive saves across all 7 DSR catalog tracks. Algorithm needs consistent saves.",
  },
  {
    id: "kt-006", artist: "kotrax", date: "2026-04-09", day: "Thu",
    platforms: ["IG Story"], type: "Story", phase: "show_day",
    priority: "red", time: "9:00 PM",
    caption: `Denver TONIGHT ⚡🏔️\n\nLarimer Lounge. DirtySnatcha. Sub.mission fam.\n\nlet's go 🔥`,
    hashtags: "",
    assets: ["Denver arrival/soundcheck BTS"],
    cta: "Tonight @ Larimer Lounge",
    notes: "Support on DS Denver show. Denver Sub.mission community is strong for bass acts.",
  },
  {
    id: "kt-007", artist: "kotrax", date: "2026-04-20", day: "Mon",
    platforms: ["IG Feed", "X"], type: "Feed Post", phase: "branding",
    priority: "yellow", time: "6:00 PM",
    caption: `new music coming ⚡\n\nstay locked.\n\n#kotrax #newmusic #bassmusic #dubstep`,
    hashtags: "#kotrax #newmusic #bassmusic #dubstep #dsr",
    assets: ["Studio teaser visual", "Kotrax branding"],
    cta: "Follow for updates",
    notes: "Teaser post. Build anticipation for next DSR release.",
  },
];

// ─── APPROVAL STATE ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:  { label: "Pending",        color: "#9ca3af", bg: "rgba(156,163,175,0.1)",  icon: "○" },
  approved: { label: "Approved ✓",     color: "#00ff88", bg: "rgba(0,255,136,0.12)",   icon: "✓" },
  revision: { label: "Needs Revision", color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  icon: "↩" },
  skipped:  { label: "Skipped",        color: "#6b7280", bg: "rgba(107,114,128,0.08)", icon: "✕" },
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ContentCalendar() {
  const [activeArtist, setActiveArtist] = useState("dirtysnatcha");
  const [filter, setFilter] = useState("all");
  const [statuses, setStatuses] = useState(() => {
    const s = {};
    POSTS.forEach(p => { s[p.id] = "pending"; });
    return s;
  });
  const [revisionNotes, setRevisionNotes] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const [editingRevision, setEditingRevision] = useState(null);
  const [revisionDraft, setRevisionDraft] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const artist = ARTISTS[activeArtist];

  const filtered = useMemo(() => {
    return POSTS
      .filter(p => p.artist === activeArtist)
      .filter(p => {
        if (filter === "all") return true;
        if (filter === "tour") return ["final_push","tour_build","show_day","post_show","announcement"].includes(p.phase);
        if (filter === "release") return p.phase === "release";
        if (filter === "branding") return p.phase === "branding" || p.phase === "maintenance";
        if (filter === "approved") return statuses[p.id] === "approved";
        if (filter === "pending") return statuses[p.id] === "pending";
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activeArtist, filter, statuses]);

  // Group by week
  const byWeek = useMemo(() => {
    const weeks = {};
    filtered.forEach(post => {
      const d = new Date(post.date + "T12:00:00");
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(post);
    });
    return weeks;
  }, [filtered]);

  const counts = useMemo(() => {
    const artistPosts = POSTS.filter(p => p.artist === activeArtist);
    return {
      total:    artistPosts.length,
      approved: artistPosts.filter(p => statuses[p.id] === "approved").length,
      pending:  artistPosts.filter(p => statuses[p.id] === "pending").length,
      revision: artistPosts.filter(p => statuses[p.id] === "revision").length,
      skipped:  artistPosts.filter(p => statuses[p.id] === "skipped").length,
    };
  }, [activeArtist, statuses]);

  const setStatus = (id, status) => {
    setStatuses(s => ({ ...s, [id]: status }));
    if (status !== "revision") setEditingRevision(null);
  };

  const copyCaption = (post) => {
    const full = post.caption + (post.hashtags ? "\n\n" + post.hashtags : "");
    navigator.clipboard.writeText(full);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatWeekLabel = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    const end = new Date(d);
    end.setDate(d.getDate() + 6);
    return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const approveAll = () => {
    const toApprove = POSTS.filter(p => p.artist === activeArtist && statuses[p.id] === "pending");
    setStatuses(s => {
      const next = { ...s };
      toApprove.forEach(p => { next[p.id] = "approved"; });
      return next;
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Courier New', Courier, monospace",
      color: "#e5e7eb",
    }}>

      {/* ── TOP NAV ── */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 50,
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 24, height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "0.05em" }}>TEN</span>
            <span style={{ color: "#00ff88", fontWeight: 900, fontSize: 15 }}>x10</span>
            <span style={{ color: "rgba(255,255,255,0.25)", margin: "0 4px" }}>·</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Content Calendar</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Approval progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "APPROVED", val: counts.approved, color: "#00ff88" },
                { label: "PENDING", val: counts.pending, color: "#fbbf24" },
                { label: "REVISION", val: counts.revision, color: "#f97316" },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: c.color, fontWeight: 700, fontSize: 13 }}>{c.val}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>{c.label}</span>
                </div>
              ))}
            </div>
            <div style={{
              height: 6, width: 100, borderRadius: 3,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${counts.total > 0 ? (counts.approved / counts.total) * 100 : 0}%`,
                background: "linear-gradient(90deg, #00ff88, #00cc66)",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ── ARTIST TABS ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {Object.values(ARTISTS).map(a => {
            const ac = POSTS.filter(p => p.artist === a.id);
            const ap = ac.filter(p => statuses[p.id] === "approved").length;
            const isActive = activeArtist === a.id;
            return (
              <button key={a.id} onClick={() => setActiveArtist(a.id)} style={{
                padding: "10px 18px",
                borderRadius: 6,
                border: isActive ? `1px solid ${a.color}` : "1px solid rgba(255,255,255,0.08)",
                background: isActive ? a.bg : "rgba(255,255,255,0.03)",
                color: isActive ? a.color : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: isActive ? 700 : 400,
                letterSpacing: "0.06em",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>{a.emoji}</span>
                <span>{a.name}</span>
                <span style={{
                  fontSize: 10, padding: "2px 6px", borderRadius: 10,
                  background: isActive ? `${a.color}22` : "rgba(255,255,255,0.06)",
                  color: isActive ? a.color : "rgba(255,255,255,0.3)",
                  fontWeight: 700,
                }}>
                  {ap}/{ac.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── ARTIST HEADER ── */}
        <div style={{
          padding: "20px 24px",
          borderRadius: 10,
          border: `1px solid ${artist.border}`,
          background: artist.bg,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: artist.color, letterSpacing: "0.04em" }}>
              {artist.emoji} {artist.name}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "0.1em" }}>
              {counts.total} POSTS · {counts.approved} APPROVED · {counts.pending} PENDING · {counts.revision} NEEDS REVISION
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={approveAll} style={{
              padding: "8px 16px", borderRadius: 5,
              border: `1px solid ${artist.color}44`,
              background: `${artist.color}15`,
              color: artist.color,
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 11, letterSpacing: "0.08em", fontWeight: 700,
            }}>
              ✓ APPROVE ALL PENDING
            </button>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { id: "all", label: "ALL POSTS" },
            { id: "tour", label: "🏟️ TOUR" },
            { id: "release", label: "🎵 RELEASE" },
            { id: "branding", label: "⬜ BRANDING" },
            { id: "approved", label: "✓ APPROVED" },
            { id: "pending", label: "○ PENDING" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: "6px 14px",
              borderRadius: 4,
              border: filter === f.id ? `1px solid ${artist.color}` : "1px solid rgba(255,255,255,0.08)",
              background: filter === f.id ? artist.bg : "rgba(255,255,255,0.02)",
              color: filter === f.id ? artist.color : "rgba(255,255,255,0.4)",
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 10, letterSpacing: "0.1em", fontWeight: 700,
              transition: "all 0.15s",
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ── POSTS BY WEEK ── */}
        {Object.keys(byWeek).length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
            No posts match this filter.
          </div>
        ) : (
          Object.entries(byWeek).map(([weekStart, posts]) => (
            <div key={weekStart} style={{ marginBottom: 40 }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)", marginBottom: 12,
                paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span>{formatWeekLabel(weekStart)}</span>
                <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                <span style={{ color: artist.color }}>{posts.filter(p => statuses[p.id] === "approved").length}/{posts.length} approved</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {posts.map(post => {
                  const status = statuses[post.id];
                  const sc = STATUS_CONFIG[status];
                  const phase = PHASE_STYLE[post.phase] || PHASE_STYLE.branding;
                  const isExpanded = expandedPost === post.id;

                  return (
                    <div key={post.id} style={{
                      borderRadius: 8,
                      border: status === "approved"
                        ? `1px solid ${artist.color}33`
                        : status === "revision"
                        ? "1px solid rgba(251,191,36,0.3)"
                        : status === "skipped"
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "1px solid rgba(255,255,255,0.07)",
                      background: status === "approved"
                        ? `${artist.color}06`
                        : status === "skipped"
                        ? "rgba(255,255,255,0.01)"
                        : "rgba(255,255,255,0.03)",
                      overflow: "hidden",
                      opacity: status === "skipped" ? 0.5 : 1,
                      transition: "all 0.2s",
                    }}>

                      {/* POST HEADER ROW */}
                      <div
                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Date */}
                        <div style={{ minWidth: 80, flexShrink: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                            {new Date(post.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{post.day}</div>
                        </div>

                        {/* Time */}
                        <div style={{
                          fontSize: 10, color: "rgba(255,255,255,0.4)",
                          minWidth: 56, flexShrink: 0,
                        }}>
                          🕐 {post.time}
                        </div>

                        {/* Phase badge */}
                        <div style={{
                          fontSize: 9, letterSpacing: "0.08em",
                          padding: "3px 8px", borderRadius: 4,
                          background: phase.bg, color: phase.color,
                          border: `1px solid ${phase.color}30`,
                          fontWeight: 700, flexShrink: 0,
                        }}>
                          {phase.label}
                        </div>

                        {/* Platforms */}
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {post.platforms.map(pl => (
                            <span key={pl} style={{
                              fontSize: 9, padding: "2px 7px", borderRadius: 4,
                              background: `${PLATFORM_COLORS[pl] || "#666"}22`,
                              color: PLATFORM_COLORS[pl] || "#aaa",
                              border: `1px solid ${PLATFORM_COLORS[pl] || "#666"}33`,
                              fontWeight: 700, letterSpacing: "0.04em",
                            }}>{pl}</span>
                          ))}
                        </div>

                        {/* Type icon */}
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                          {TYPE_ICON[post.type] || "📄"} {post.type}
                        </div>

                        <div style={{ flex: 1 }} />

                        {/* Priority */}
                        {post.priority === "red" && (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", flexShrink: 0 }} />
                        )}
                        {post.priority === "yellow" && (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", flexShrink: 0 }} />
                        )}

                        {/* Status badge */}
                        <div style={{
                          fontSize: 10, padding: "3px 10px", borderRadius: 4,
                          background: sc.bg, color: sc.color,
                          border: `1px solid ${sc.color}30`,
                          fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0,
                        }}>
                          {sc.icon} {sc.label}
                        </div>

                        {/* Expand arrow */}
                        <div style={{
                          color: "rgba(255,255,255,0.25)", fontSize: 10,
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}>▼</div>
                      </div>

                      {/* EXPANDED CONTENT */}
                      {isExpanded && (
                        <div style={{
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          padding: "16px 16px 20px",
                          display: "grid",
                          gridTemplateColumns: "1fr 320px",
                          gap: 20,
                        }}>
                          {/* LEFT — Caption + Details */}
                          <div>
                            {/* Caption */}
                            <div style={{ marginBottom: 16 }}>
                              <div style={{
                                fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)",
                                marginBottom: 8, textTransform: "uppercase",
                              }}>Caption</div>
                              <div style={{
                                background: "rgba(0,0,0,0.3)", borderRadius: 6,
                                padding: "14px 16px", fontSize: 13, lineHeight: 1.7,
                                color: "#e5e7eb", whiteSpace: "pre-wrap",
                                border: "1px solid rgba(255,255,255,0.06)",
                                fontFamily: "inherit",
                              }}>
                                {post.caption}
                              </div>
                              {post.hashtags && (
                                <div style={{
                                  marginTop: 8, fontSize: 11,
                                  color: "rgba(100,149,237,0.7)", lineHeight: 1.6,
                                  fontFamily: "inherit",
                                }}>
                                  {post.hashtags}
                                </div>
                              )}
                            </div>

                            {/* CTA */}
                            <div style={{ marginBottom: 12 }}>
                              <span style={{
                                fontSize: 9, letterSpacing: "0.12em",
                                color: "rgba(255,255,255,0.3)", marginRight: 8, textTransform: "uppercase",
                              }}>CTA:</span>
                              <span style={{ fontSize: 12, color: artist.color }}>{post.cta}</span>
                            </div>

                            {/* Notes */}
                            {post.notes && (
                              <div style={{
                                fontSize: 11, color: "rgba(255,255,255,0.4)",
                                padding: "8px 12px", borderRadius: 4,
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                lineHeight: 1.6,
                              }}>
                                📋 {post.notes}
                              </div>
                            )}

                            {/* Revision note */}
                            {status === "revision" && revisionNotes[post.id] && (
                              <div style={{
                                marginTop: 12, fontSize: 11,
                                padding: "8px 12px", borderRadius: 4,
                                background: "rgba(251,191,36,0.08)",
                                border: "1px solid rgba(251,191,36,0.2)",
                                color: "#fbbf24", lineHeight: 1.6,
                              }}>
                                ↩ Revision request: {revisionNotes[post.id]}
                              </div>
                            )}

                            {/* Revision input */}
                            {editingRevision === post.id && (
                              <div style={{ marginTop: 12 }}>
                                <textarea
                                  autoFocus
                                  value={revisionDraft}
                                  onChange={e => setRevisionDraft(e.target.value)}
                                  placeholder="What needs to change? (e.g. 'Soften the language' or 'Remove venue name until confirmed')"
                                  style={{
                                    width: "100%", minHeight: 80,
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid rgba(251,191,36,0.3)",
                                    borderRadius: 4, padding: 10,
                                    color: "#e5e7eb", fontFamily: "inherit",
                                    fontSize: 12, resize: "vertical",
                                    outline: "none", boxSizing: "border-box",
                                  }}
                                />
                                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                  <button onClick={() => {
                                    setRevisionNotes(n => ({ ...n, [post.id]: revisionDraft }));
                                    setStatus(post.id, "revision");
                                    setEditingRevision(null);
                                    setRevisionDraft("");
                                  }} style={{
                                    padding: "6px 14px", borderRadius: 4, cursor: "pointer",
                                    background: "rgba(251,191,36,0.15)",
                                    border: "1px solid rgba(251,191,36,0.3)",
                                    color: "#fbbf24", fontFamily: "inherit",
                                    fontSize: 10, letterSpacing: "0.08em", fontWeight: 700,
                                  }}>SUBMIT REVISION</button>
                                  <button onClick={() => { setEditingRevision(null); setRevisionDraft(""); }} style={{
                                    padding: "6px 14px", borderRadius: 4, cursor: "pointer",
                                    background: "transparent",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "rgba(255,255,255,0.3)", fontFamily: "inherit",
                                    fontSize: 10,
                                  }}>CANCEL</button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* RIGHT — Assets + Actions */}
                          <div>
                            {/* Assets */}
                            <div style={{ marginBottom: 20 }}>
                              <div style={{
                                fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)",
                                marginBottom: 8, textTransform: "uppercase",
                              }}>Assets Needed</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {post.assets.map((asset, i) => (
                                  <div key={i} style={{
                                    display: "flex", alignItems: "flex-start", gap: 8,
                                    padding: "7px 10px", borderRadius: 4,
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    fontSize: 11, color: "rgba(255,255,255,0.6)",
                                    lineHeight: 1.4,
                                  }}>
                                    <span style={{ color: artist.color, flexShrink: 0, marginTop: 1 }}>◆</span>
                                    {asset}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Post time callout */}
                            <div style={{
                              padding: "10px 12px", borderRadius: 4,
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              marginBottom: 20,
                              display: "flex", alignItems: "center", gap: 10,
                            }}>
                              <span style={{ fontSize: 18 }}>🕐</span>
                              <div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>OPTIMAL POST TIME</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#e5e7eb", marginTop: 2 }}>{post.time}</div>
                              </div>
                            </div>

                            {/* Approval actions */}
                            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 8, textTransform: "uppercase" }}>
                              Approval
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <button onClick={() => { setStatus(post.id, "approved"); setExpandedPost(null); }} style={{
                                width: "100%", padding: "10px",
                                borderRadius: 4, cursor: "pointer",
                                background: status === "approved" ? "rgba(0,255,136,0.15)" : "rgba(0,255,136,0.07)",
                                border: `1px solid ${status === "approved" ? "#00ff88" : "rgba(0,255,136,0.2)"}`,
                                color: "#00ff88", fontFamily: "inherit",
                                fontSize: 11, letterSpacing: "0.1em", fontWeight: 700,
                                transition: "all 0.15s",
                              }}>
                                ✓ APPROVE — QUEUE FOR SCHEDULING
                              </button>

                              <button
                                onClick={() => {
                                  if (editingRevision === post.id) {
                                    setEditingRevision(null);
                                    setRevisionDraft("");
                                  } else {
                                    setEditingRevision(post.id);
                                    setRevisionDraft(revisionNotes[post.id] || "");
                                  }
                                }}
                                style={{
                                  width: "100%", padding: "10px",
                                  borderRadius: 4, cursor: "pointer",
                                  background: status === "revision" ? "rgba(251,191,36,0.12)" : "rgba(251,191,36,0.05)",
                                  border: `1px solid ${status === "revision" ? "rgba(251,191,36,0.4)" : "rgba(251,191,36,0.15)"}`,
                                  color: "#fbbf24", fontFamily: "inherit",
                                  fontSize: 11, letterSpacing: "0.1em", fontWeight: 700,
                                  transition: "all 0.15s",
                                }}>
                                ↩ REQUEST REVISION
                              </button>

                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => copyCaption(post)} style={{
                                  flex: 1, padding: "8px",
                                  borderRadius: 4, cursor: "pointer",
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: copiedId === post.id ? "#00ff88" : "rgba(255,255,255,0.5)",
                                  fontFamily: "inherit", fontSize: 10, letterSpacing: "0.08em",
                                  transition: "all 0.15s",
                                }}>
                                  {copiedId === post.id ? "✓ COPIED" : "⎘ COPY CAPTION"}
                                </button>
                                <button onClick={() => setStatus(post.id, status === "skipped" ? "pending" : "skipped")} style={{
                                  flex: 1, padding: "8px",
                                  borderRadius: 4, cursor: "pointer",
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  color: "rgba(255,255,255,0.3)",
                                  fontFamily: "inherit", fontSize: 10, letterSpacing: "0.08em",
                                }}>
                                  {status === "skipped" ? "↺ RESTORE" : "✕ SKIP"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "16px 24px",
        textAlign: "center",
        fontSize: 10,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: "0.1em",
      }}>
        TENx10 · Content Calendar v1.0 · {POSTS.length} POSTS ACROSS 4 ARTISTS · APPROVAL → AUTO-SCHEDULE PIPELINE
      </div>
    </div>
  );
}
