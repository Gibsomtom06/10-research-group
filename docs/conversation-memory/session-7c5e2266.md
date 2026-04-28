# Session 7c5e2266

### BUILT:
- Removed hardcoded artist data from `HomepageClient.tsx`, `AboutClient.tsx`, and `ArtistsClient.tsx`.
- Updated the Xai prompt in `core.ts` to include identity safety rules and scraper permission language.
- Built the Onboarding Wizard with multi-artist support.
- Added the "Send Invite" button to the artists dashboard page.
- Updated the artist join page, backend route for join submission, and the artists dashboard to show the Invite button and the manager's name.
- Added Accept/Decline quick reply buttons to the deals page.
- Fixed TypeScript errors across 4 files.
- Commits were pushed to GitHub, and Vercel deployment was triggered.
- Built the Revenue Sustainability Engine, including a dedicated page at `/dashboard/revenue`.
- Added the Revenue Engine link to the dashboard nav.
- Applied migration 017 to create the `artist_invites` table in production.
- Built the artist portal and improved the Xai agent page.
- Created a morning briefing page with a daily summary of what needs attention.
- Updated the finance page to remove the hardcoded "Lee" from the commission breakdown.
- Added a Profile link to the artist nav.
- Wrote and committed the morning handoff note.

### DECIDED:
- To treat `thomas@dirtysnatcha.com` and `thomas@dirtysnatcharecords.com` as the same login, with the former being a forwarding alias to the latter.
- To add an `is_managed` column to the artists table to differentiate between managed and non-managed artists.
- To update the Xai system prompt to reflect a more personal and intuitive assistant.
- To implement memory for Xai to avoid asking the same questions and to be more useful when a user is logged in.
- For Xai to ask for the artists a manager manages, add them to the Roster, ask for their contact, and run the scraping part of the prompt.

### PENDING:
- Implementing memory for Xai to store conversations and avoid repetition.
- Making Xai more useful when a user is logged in, including asking for managed artists and adding them to the Roster.
- Running the scraping part of the prompt for managed artists.
- Cleaning up duplicate artist/manager DB records.
- Connecting Spotify OAuth to pull real stream counts into the Revenue Engine.

### CONTEXT:
- The conversation involves developing and refining the TENx10 music industry SaaS platform, including its features and user interface.
- Xai is an integral part of the platform, acting as a personal assistant and strategist for artists and managers.
- The platform aims to provide a comprehensive suite of tools for managing artists' careers, including revenue tracking, onboarding, and deal management.
- The user is a manager who needs the platform to effectively manage their artists and make informed decisions about their careers.
