# DSR Release Checklist — Template

Copy this file into each release folder (e.g., `L:/My Drive/2026/<Artist> - <Title>/CHECKLIST.md`) and check off as the release moves through the pipeline. The phases are sequential — don't move to the next phase until all blocking items in the current one are done.

**Release:** ` ` ⟵ fill in: e.g., `Dark Matter & Barooka — Run The Game`
**Type:** ` Single | EP | Album `
**Target release date:** ` `
**Distributor:** Ingrooves (Label Engine) — Virgin Music Group
**Publisher:** DirtySnatcha Records Publishing (ASCAP) 1238282844 + LAB10 (BMI) 01262829440

---

## Phase 1 — Approval & onboarding

- [ ] Track approved by DSR (Leigh / Thomas)
- [ ] Confirm artist roster: every member's legal name, p/k/a, address, email, phone
- [ ] Confirm membership of multi-member acts (duos, trios) — every signer must be identified
- [ ] Create **Facebook Messenger group** with all artists + Thomas + Leigh — this is the primary comms channel for the release
- [ ] Run `python scripts/release/confirm_release.py --artist "<Artist>" --title "<Title>" [--year 2026]` to scaffold the Drive folder and `metadata.yaml`
- [ ] Confirm folder created at `L:/My Drive/<year>/<Artist> - <Title>/`

## Phase 2 — Asset gathering

- [ ] **Audio:** final master delivered as WAV/FLAC at top of release folder. Filename: `<Artist> - <Title>.wav`. Confirm BPM, key, master volume per DSP loudness standards.
- [ ] **Audio:** instrumental version (if available)
- [ ] **Audio:** stems (if commissioned for remix or sync use)
- [ ] **Cover art:** 3000×3000 px JPG at top of release folder. Filename: `<Artist> - <Title>.jpg` or `cover.jpg`. Confirm: no logos, no DSP-prohibited content, RGB, sRGB.
- [ ] **Square crops:** 1500×1500 (Spotify), 1080×1080 (Instagram) — derived from main cover
- [ ] **Track durations** captured per track for Schedule A
- [ ] **Lyric flagging:** run `python scripts/lyric-flagger/lyric_flagger.py --release "<Artist> - <Title>"` to populate `lyrics/` subfolder + flag any DSP-disallowed content
- [ ] **Splits agreed:** writer split per writer (default equal-share), master royalty per artist/act, internal duo splits (12.5% × 4 default for 4-writer collabs)
- [ ] **PRO check:** for every writer, look up at ASCAP ACE / Songview to confirm registration + IPI on file. If not registered, send `publishing/PRO_REGISTRATION_GUIDE_DSR_ARTISTS_*.md` and chase IPIs.

## Phase 3 — Contract execution

- [ ] Draft contract from KAIME-structure template (`contracts/<date>-<artist>-<title>-DSR-Contract.md`). Use canonical structure: §1–12 + Schedule A.
- [ ] Render contract to PDF: `npx marked -i <contract>.md -o <contract>.body.html && node _wrap_html.cjs && agent-browser open <html> && agent-browser pdf <contract>.pdf`
- [ ] Convert to Acrobat-ready file (.docx if needed for Adobe Sign)
- [ ] Adobe Acrobat Sign send: signers in order — all artists first, label (Leigh or Thomas) last. Recipient slots auto-detect from `{{Sig_es_:signerN:signature}}` text tags in the PDF.
- [ ] Toggle "Complete in order" so label signs after artists
- [ ] Sender adds the IPI ask in the cover message for any writer still missing PRO/IPI
- [ ] Wait for all signatures (typical: 1–7 days)
- [ ] Adobe emails final signed PDF — drop into release folder as `<Artist> <Title> Contract SIGNED.pdf`

## Phase 4 — Composition & distribution registration

- [ ] **PRO composition registration:** at ASCAP (DSR Publishing IPI 1238282844) and BMI (LAB10 IPI 01262829440) once writer IPIs are confirmed. Include writer splits + ISRC.
- [ ] **MLC registration:** publisher-side composition record at the Mechanical Licensing Collective. DSR Publishing as publisher.
- [ ] **Distribution submission:** Label Engine / Ingrooves — upload audio, cover, metadata, per-track contributors with PRO IPIs. Confirm release date.
- [ ] **ISRC + UPC:** assigned by Ingrooves on submission. Capture and write into `metadata.yaml`.
- [ ] **Split-pay setup:** Label Engine / Ingrooves emails each artist to set up split-pay account. Confirm all artists complete.
- [ ] **DSP catalog updates:** confirm Spotify for Artists, Apple Music for Artists, etc., have the release in pre-save/active state.

## Phase 5 — Pre-release marketing

- [ ] **Spotify pre-save** campaign (Hypeddit or equivalent)
- [ ] **One-sheet** PDF for press / blog pitches
- [ ] **Premiere copy** drafted for Mixmag / EDM.com / preferred outlet
- [ ] **Spotify Canvas** (3–8 sec vertical loop per track)
- [ ] **Instagram visualizer / TikTok teaser** (15–30 sec)
- [ ] **YouTube content** plan (visualizer or full video)
- [ ] **Artist socials** coordinated — every artist posts pre-save link on schedule
- [ ] **DSR socials** scheduled — Twitter, IG, TikTok, Discord
- [ ] **Email blast** drafted to DSR mailing list

## Phase 6 — Release day

- [ ] Track is live on Spotify, Apple, YouTube, SoundCloud — verify all DSPs
- [ ] Artist credits display correctly on every DSP (correct primary artist, no spelling issues)
- [ ] DSR socials post day-of (drop announcement, link, artwork)
- [ ] Each artist posts day-of (verify in FB Messenger group)
- [ ] Premiere outlet publishes if scheduled
- [ ] Pre-save converts to follow / save count tracked
- [ ] Add to DSR official Spotify playlist + relevant DSR-curated playlists

## Phase 7 — Post-release (first 30 days)

- [ ] Monitor Spotify for Artists / Apple Music for Artists / YouTube Studio
- [ ] Check Shazam tags, Soundhound, social mentions
- [ ] Confirm split-pay running — first stream royalties hit each artist's account
- [ ] Submit for sync opportunities (FreeFM, Musicbed, etc.) if applicable
- [ ] Feedback loop: what worked, what didn't — update `lessons-learned.md` in repo

---

## Reference files

- **Contract template structure:** `contracts/2026-04-15-KAIME_Of_The_Sea_EP_Contract_FINAL.pdf` (most recent canonical structure)
- **PRO registration help:** `publishing/PRO_REGISTRATION_GUIDE_DSR_ARTISTS_2026-04-25.md`
- **Operating bible:** `DSR_Master_Operating_Bible_v3.md`
- **Storage convention:** `L:/My Drive/<year>/<Artist> - <Title>/` (canonical) — see `~/.claude/projects/.../memory/reference_dsr_release_storage.md`
- **E-sign convention:** Adobe Acrobat Sign via Adobe CC Student — see `~/.claude/projects/.../memory/reference_dsr_contract_signing.md`
