# Tournament Control Room Design

## Status

Approved direction from product conversation on 2026-05-06. This spec defines the first implementation slice for a Valorant tournament operations experience.

## Problem

The app already has a strong Valorant-inspired landing page, social sign-in, squad registration, a captain dashboard, roster view, and bracket feed. The next meaningful upgrade should make the product feel like a real tournament platform instead of a static registration shell.

Research from Riot Premier docs, player discussions, Battlefy, start.gg, and Toornament points to the same needs: players want less schedule ambiguity, clearer next actions, team and roster confidence, matchday check-in, result reporting, dispute handling, and Discord-friendly operations. Organizers need a fast way to see which squads are ready, blocked, or risky.

## Goals

- Turn the logged-in dashboard into a captain-facing mission control surface.
- Add a matchday-ready experience that shows check-in state, opponent, schedule, lobby instructions, and result/reporting actions.
- Add the data and query foundations needed for admin review and later full admin controls.
- Keep the current high-impact Valorant visual language: dark tactical surfaces, angular panels, red action states, bone text, scan/reveal motion, compact broadcast-style metadata.
- Improve empty and pending states so every player-facing page tells the captain what happens next.

## Non-Goals

- No real Riot API integration in this slice.
- No automatic Discord bot or channel creation in this slice.
- No full tournament bracket generator in this slice.
- No complex multi-admin permissions beyond using the existing `users.role` field.
- No file upload proof workflow yet; the UI can reserve the action, but durable uploads are a later slice.

## Research Inputs

- Riot Premier uses a team hub, match schedule, standings, roster ownership, weekly match limits, and playoff/qualification status.
- Riot Premier updates removed fixed enrollment windows and emphasized flexible team creation, roster changes before playoffs, and standings-driven seeding.
- Player discussion repeatedly highlights scheduling friction, wide matchmaking bands, LFG/team-finder gaps, and the need for more reliable tournament hubs.
- Battlefy, start.gg, and Toornament all converge around registration validation, check-in, match dashboard, score reporting, disputes, notifications, and organizer analytics.

Reference links:

- https://support-valorant.riotgames.com/hc/en-us/articles/42089963186451-Premier-Guide
- https://support-valorant.riotgames.com/hc/articles/42089892246035
- https://blog.battlefy.com/8-best-tournament-software-features-for-esports-organizers
- https://help.start.gg/en/articles/1465711-introduction-to-online-tournaments
- https://help.start.gg/en/articles/1465715-online-tournament-guide
- https://www.toornament.com/en_US/features
- https://www.toornament.com/en_US/features/participant-interface
- https://help.toornament.com/participant/matches/play-a-match-with-check-in

## Users

- Captain: owns the team registration, checks roster state, follows next actions, checks in, and reports results.
- Player: sees roster and match state through the captain dashboard in the current slice.
- Admin: reviews registration/match readiness through foundation data and a later admin UI.
- Visitor: uses the public page for tournament status, leaderboard, news, and bracket context.

## Product Shape

The first feature should feel like a live tactical console, not a form admin panel.

The dashboard becomes a "Captain Mission Feed" with three priority zones:

- Mission status: registration status, roster lock, tournament phase, next deadline.
- Ready room: next match, opponent, check-in state, lobby instructions, and result actions.
- Squad integrity: roster count, starter/substitute composition, risk flags, missing profile data.

The bracket page becomes a "Matchday Ready Room" when a next match exists:

- Opponent cards with team names and match metadata.
- Check-in module with countdown-style urgency.
- Match actions: check in, report result, open dispute.
- Timeline of current match state: scheduled, ready, live, reported, disputed, completed.

The roster page becomes a sharper "Roster Vault":

- Keep player cards, but add readiness signals per slot.
- Show captain ownership and substitute role more clearly.
- Add a compact review panel explaining why the roster is locked, pending, or blocked.

## Architecture

Use the existing Next.js App Router and server-first pattern.

Routes:

- `/dashboard`: captain mission feed.
- `/dashboard/roster`: roster vault with integrity state.
- `/dashboard/brackets`: match feed and ready room.
- Future `/dashboard/admin`: admin control room, gated by `users.role === "admin"`.

Server modules:

- Extend `src/features/tournaments/queries.ts` with a richer captain mission query.
- Extend `src/features/brackets/queries.ts` with a next-match/ready-room query.
- Add `src/features/matchday/status.ts` for pure status helpers and UI copy.
- Add `src/features/matchday/actions.ts` for server actions once database fields exist.

UI modules:

- Add focused dashboard components under `src/components/dashboard/`:
  - `mission-feed.tsx`
  - `ready-room-panel.tsx`
  - `squad-integrity-panel.tsx`
  - `match-action-panel.tsx`
  - `admin-signal-card.tsx`

Keep components presentational where possible. Put database reads in route pages or feature query modules.

## Data Model

The current schema already covers users, teams, members, tournaments, registrations, and matches. For the first implementation slice, prefer deriving most states from existing fields:

- Registration state from `tournament_registrations.status`.
- Check-in state from `tournament_registrations.checked_in_at`.
- Roster completeness from `team_members`.
- Match state from `matches.status`, `scheduled_at`, scores, and team ids.

Do not change the database schema in the first implementation pass. The existing schema is enough for mission status, roster integrity, next match display, and check-in via `tournament_registrations.checked_in_at`.

Reserve these match reporting fields for a later migration:

- `matches.reported_by_team_id` nullable uuid referencing `teams.id`.
- `matches.reported_at` nullable timestamp.
- `matches.dispute_reason` nullable text.

Keep report/dispute buttons visually present but disabled with clear "coming online after admin publish" copy. Do not fake successful writes.

## Data Flow

Captain dashboard:

1. Authenticate with `auth()`.
2. Load latest registration owned by the session user.
3. Load team roster and the next match for that team.
4. Derive mission items from registration, roster, tournament, and match state.
5. Render the console with deterministic fallback states if there is no registration or no match.

Ready room:

1. Authenticate with `auth()`.
2. Resolve the captain's active team registration.
3. Load the next relevant match, including both teams.
4. Render actions according to match status and registration status.
5. Server actions must re-check ownership and current status before mutating.

Admin foundation:

1. Use `users.role` to detect admin.
2. Future query loads registrations with team, captain, roster count, checked-in timestamp, and match assignment.
3. Admin decisions update registration status; rejected registrations require a rejection reason.

## Error Handling

- Unauthenticated users redirect to `/sign-in`.
- Captains without a team see a high-energy empty state that sends them to `/register`.
- Captains with a pending registration see review copy, not match actions.
- Captains with no match see bracket pending and admin signal copy.
- Check-in/report actions must fail closed if the user is not the captain of the team.
- Mutations should return Spanish-friendly errors suitable for toast or inline display.
- Do not expose stack traces or database details in UI copy.

## Visual Design

Preserve the current Valorant tournament identity:

- Dark stage background with arena key art at very low opacity.
- Red for action, danger, live state, and critical timing.
- Bone/off-white for titles and confirmed states.
- Green only for ready/verified signals.
- Angular panels and thin technical borders.
- Dense metadata strips, status chips, and scanline accents.
- Motion should communicate lock, scan, or state change; avoid decorative motion that blocks reading.

New screens should look like a VCT broadcast operations overlay:

- Big compressed display typography for page titles.
- Tight tactical labels for metadata.
- Match cards with clear left/right team confrontation.
- Countdown and readiness blocks that stay readable on mobile.
- No nested cards inside cards; use full-width console bands and single-level panels.

## Testing

Run after implementation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Browser sanity pass on:
  - `/`
  - `/sign-in`
  - `/dashboard`
  - `/dashboard/roster`
  - `/dashboard/brackets`
- Verify logged-out redirects still work.
- Verify dashboard empty state if no registration exists.
- Verify pending registration state.
- Verify match-ready state if seeded or mocked data exists.

## Implementation Slices

Slice 1: Mission Feed UI

- Refactor `/dashboard` around mission status, ready room preview, and squad integrity.
- Use existing data and static fallback copy where live data is not available yet.
- Keep all current routes functional.

Slice 2: Ready Room

- Upgrade `/dashboard/brackets` from a passive match feed into matchday mode.
- Add check-in/report/dispute action surfaces.
- Wire check-in only if the existing registration field is enough and ownership validation is simple.

Slice 3: Roster Vault Polish

- Add per-slot readiness and captain/substitute clarity.
- Make roster review status obvious.

Slice 4: Admin Foundation

- Add query helpers and create an admin-only route shell.
- Show registration queue, roster count, state, and quick review signals.
- Defer full approve/reject mutations if the database/state flow needs a separate plan.

## Acceptance Criteria

- A captain can understand their next tournament action within five seconds of opening `/dashboard`.
- The bracket page feels useful before brackets are published and becomes matchday-focused when a match exists.
- The roster page explains readiness, not just names.
- No existing auth, registration, dashboard, roster, or bracket route regresses.
- The UI remains consistent with the current Valorant tactical theme across desktop and mobile.
