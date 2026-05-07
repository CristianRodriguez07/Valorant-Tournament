# Double Elimination Competitive Platform Design

## Status

Scope approved on 2026-05-07. The selected direction is "Competition + Identity": a real Double Elimination tournament engine, visual bracket surfaces, and the first durable data foundation for player profiles, match history, and ranking.

## Problem

The app now has a strong Valorant identity, captain dashboard, roster readiness, admin registration review, captain check-in, match result reporting, disputes, and an admin result desk. The remaining gap is that the tournament itself is not yet a real competitive structure. Admin can launch a match, but the current launch flow creates a placeholder opponent and does not understand seeds, upper bracket, lower bracket, eliminations, byes, grand finals, or automatic advancement.

Without bracket truth, every later feature stays shallow:

- Player history cannot know whether a win was upper bracket, lower bracket, elimination, or final.
- Rankings cannot separate meaningful progression from isolated match records.
- Admin operations cannot confidently publish a bracket or advance the tournament.
- Captains cannot understand their full path through the tournament.

## Goals

- Generate a Double Elimination bracket from approved or checked-in teams.
- Use `tournament_registrations.seed` as the first seeding source.
- Support non-power-of-two team counts through bracket-size calculation and bye advancement.
- Replace the placeholder match launch path with a bracket publish flow.
- Advance teams automatically when an admin completes a reported match.
- Route losing teams from upper bracket into the correct lower bracket slot.
- Mark teams eliminated after their second loss.
- Create a visual upper/lower bracket experience for admin and captains.
- Create match history and ranking foundations from completed matches.
- Preserve the current Valorant tactical UI language.

## Non-Goals

- No Swiss, round-robin, or group stage format in this slice.
- No Discord automation, notifications, proof uploads, or LFG/team finder yet.
- No Riot API integration or stat import.
- No real-time sockets; server-rendered refresh and revalidation are enough.
- No configurable grand-final rule variants. This slice uses one standard rule: if the lower-bracket finalist wins the first Grand Final, the system creates a Reset Final; otherwise the first Grand Final decides champion.
- No new public overlay or dedicated public bracket route. Public integration is limited to reusing the read-only bracket renderer inside existing surfaces if the implementation plan can do it without adding separate routing scope.

## Users

- Admin: seeds teams, publishes the bracket, reviews results/disputes, and advances the tournament.
- Captain: sees their current match, bracket path, lower-bracket risk, and match history.
- Player: gains a visible competitive identity through profile/history/ranking data.
- Visitor: sees a credible tournament bracket instead of static marketing claims.

## Recommended Product Shape

### Admin Seed Board

The admin control room gains a "Seed Board" section for each active tournament. It shows approved and checked-in teams, their roster readiness, registration state, current seed, and bracket eligibility. Admin can publish the bracket only when at least two eligible teams exist.

Initial seeding should be conservative:

- Prefer existing `tournament_registrations.seed`.
- Fill missing seeds by registration approval/check-in order.
- Prevent duplicate seeds at generation time.
- Show warnings for missing seeds, duplicate seeds, odd team counts, and teams not checked in.

The first implementation can use deterministic seed assignment instead of drag-and-drop. A polished manual seed editor can follow once bracket generation is stable.

### Bracket Publish Flow

Publishing a bracket creates every structural match slot for the tournament:

- Upper bracket rounds.
- Lower bracket rounds.
- Grand Final, plus a conditional Reset Final if the lower-bracket finalist wins the first final.
- Bye-driven automatic advancements.
- Empty future slots that receive teams as the bracket advances.

Only first-round ready matches with two assigned teams should be playable. Future matches remain `scheduled` in the database; the UI labels them "Waiting for teams" until both teams are known.

Generation must be idempotent from the admin UI: if a tournament already has bracket matches, the publish action should refuse to create duplicates and instead send the admin to the bracket view.

### Captain Bracket Path

The captain dashboard and bracket page should stop feeling like a single-match feed. They should show:

- Current match and opponent.
- Whether the team is in upper bracket, lower bracket, eliminated, or champion path.
- Next possible slot after win and after loss where known.
- Match history with wins, losses, and bracket stage labels.

The ready room remains the primary action surface. The bracket is the strategic map around it.

### Visual Bracket

Use one shared bracket renderer with context-specific wrappers:

- Admin mode: status, unresolved slots, publish/advance signals, review warnings.
- Captain mode: highlight my team, current match, danger path, and next opponent.
- Public mode later: cleaner broadcast-style read-only bracket.

The visual shape should emphasize Valorant tournament drama:

- Upper bracket as the main red-lit lane.
- Lower bracket as a compressed survival lane.
- Elimination markers and champion moment.
- Match cards with team names, seed, score, status, and best-of.
- No nested card stacks; use full-width tactical lanes and single-level match nodes.

## Architecture

Keep the app server-first with pure bracket logic isolated from database writes.

New modules:

- `src/features/brackets/double-elimination.ts`: pure bracket generation and advancement helpers.
- `src/features/brackets/double-elimination.test.ts`: tests for seeds, byes, lower drops, grand final, and advancement.
- `src/features/brackets/types.ts`: structural types shared by generator, queries, and UI.
- `src/features/brackets/actions.ts`: admin server actions for publishing and advancing bracket state.
- `src/features/profiles/queries.ts`: player and team history/ranking query foundation.
- `src/components/dashboard/double-elim-bracket.tsx`: shared bracket renderer.
- `src/components/dashboard/seed-board.tsx`: admin seed/publish surface.
- `src/components/dashboard/player-history-panel.tsx`: first history/ranking panel for dashboard or profile surface.

Existing modules to extend:

- `src/db/schema.ts`
- `src/features/admin/actions.ts`
- `src/features/admin/match-review.ts`
- `src/features/brackets/queries.ts`
- `src/features/tournaments/queries.ts`
- `src/app/(dashboard)/dashboard/admin/page.tsx`
- `src/app/(dashboard)/dashboard/brackets/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`

## Data Model

The current `matches` table can store basic tournament matches, but it cannot represent Double Elimination structure safely. Add explicit bracket metadata rather than overloading `round` and `matchNumber`.

Recommended schema additions:

### Match Fields

- `bracket` enum: `upper`, `lower`, `grand_final`, `grand_final_reset`.
- `bracketRound` integer.
- `bracketMatchNumber` integer.
- `nextMatchId` nullable uuid referencing `matches.id`.
- `nextMatchSlot` enum: `team_a`, `team_b`.
- `loserNextMatchId` nullable uuid referencing `matches.id`.
- `loserNextMatchSlot` enum: `team_a`, `team_b`.
- `sourceMatchAId` nullable uuid referencing `matches.id`.
- `sourceMatchBId` nullable uuid referencing `matches.id`.

Keep existing `round` and `matchNumber` as display/backward-compatible ordering fields during the migration. New code should prefer bracket metadata.

### Team Standing Table

Add `tournament_team_standings`:

- `id`
- `tournamentId`
- `teamId`
- `seed`
- `wins`
- `losses`
- `status`: `active`, `lower_bracket`, `eliminated`, `runner_up`, `champion`
- `lastMatchId`
- timestamps

This table makes captain dashboards, rankings, and admin summaries cheap and clear.

### Player Snapshot Table

Add `tournament_player_snapshots`:

- `id`
- `tournamentId`
- `teamId`
- `userId` nullable
- `riotId`
- `riotIdNormalized`
- `role`
- `isCaptain`
- `seed`
- timestamps

Snapshots preserve identity even if a user edits their Riot ID or a roster changes after bracket publish.

## Bracket Generation Rules

1. Load eligible registrations for one tournament.
2. Sort by seed ascending. For missing seeds, append by approval/check-in time.
3. Calculate bracket size as the next power of two.
4. Place teams using standard seed pairing: `1 vs N`, `4 vs 5`, `3 vs 6`, `2 vs N-1` style for balanced halves.
5. Create upper bracket round one matches from seed pairings.
6. Create all future upper, lower, and grand-final match slots.
7. Connect each upper match winner to its next upper slot.
8. Connect each upper match loser to the correct lower slot.
9. Connect lower match winners through the lower bracket.
10. Connect the lower final winner and upper final winner to Grand Final.
11. Do not pre-create the Reset Final; create it only if the lower-bracket finalist wins the first Grand Final.
12. Auto-advance byes before returning success.
13. Create standings and player snapshots in the same transaction.

The pure generator should return a full bracket plan without touching the database. The server action writes that plan transactionally.

## Advancement Rules

When admin completes a reported match:

1. Validate match status is `reported`.
2. Validate winner belongs to the match.
3. Compute loser.
4. Update completed match.
5. Increment winner standing wins.
6. Increment loser standing losses.
7. If the completed match has `nextMatchId`, place winner in `nextMatchSlot`.
8. If the completed match has `loserNextMatchId`, place loser in `loserNextMatchSlot`.
9. If loser has two losses before finals, mark eliminated.
10. If completed match is Grand Final and the upper-bracket finalist wins, mark winner champion, loser runner-up, and tournament completed.
11. If completed match is Grand Final and the lower-bracket finalist wins, create a Reset Final with the same teams and set it `ready`.
12. If completed match is Reset Final, mark winner champion, loser runner-up, and tournament completed.
13. Set newly filled matches to `ready` when both teams are assigned.
14. Revalidate admin, dashboard, bracket, roster, and public pages.

Disputed matches should never advance automatically.

## Player Profiles, History, And Ranking Foundation

This slice should not build a full social profile product, but it should create useful surfaces immediately:

- Captain dashboard: "Team record" block from standings.
- Bracket page: per-match history for the current team.
- Admin page: standings table sorted by champion/active/eliminated, wins, losses, seed.
- Future profile route foundation: queries that can return a user's tournament appearances by Riot ID or user ID.

Ranking should be simple and explainable:

1. Champion.
2. Active upper-bracket teams.
3. Active lower-bracket teams.
4. Eliminated teams by placement proxy: deeper bracket progress, then wins, then seed.

Do not invent ELO yet. Tournament placement is enough for this phase.

## Error Handling

- Publishing requires admin role.
- Publishing requires at least two eligible teams.
- Publishing refuses duplicate bracket creation for the same tournament.
- Publishing reports exact invalid seed problems.
- Completing a match fails closed if the match is disputed, already completed, or has no valid winner.
- Advancement fails transactionally; no partial winner/loser movement.
- Captains without a bracket see the existing pending bracket copy.
- Captains eliminated from the bracket see history and final placement, not active match actions.

## Testing

Pure unit tests:

- 2-team bracket supports a Grand Final and conditional Reset Final.
- 4-team bracket creates upper, lower, and grand-final slots.
- 6-team bracket creates byes and auto-advances them.
- Duplicate/missing seeds resolve deterministically.
- Upper-bracket loser drops to the correct lower slot.
- Lower-bracket loser is eliminated.
- Grand Final upper-side winner becomes champion without reset.
- Grand Final lower-side winner creates a Reset Final.
- Reset Final winner becomes champion.
- Disputed/reported/completed status transitions do not advance incorrectly.

Integration-style checks:

- Admin publish creates matches, standings, and player snapshots in one flow.
- Admin completing a reported match advances winner and loser correctly.
- Captain current match query finds the next ready match.
- Dashboard history query includes completed matches.

Manual verification:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Browser sanity on `/`, `/sign-in`, `/dashboard`, `/dashboard/brackets`, `/dashboard/admin`.
- Admin publishes bracket from existing approved teams.
- Captain reports result; admin completes; next bracket slot updates.

## Implementation Slices

### Slice 1: Pure Bracket Engine

Build and test the generator/advancement helpers with no UI and no database writes. This is the risk-control slice.

### Slice 2: Schema And Publish Action

Add bracket metadata, standings, and snapshots. Replace placeholder match launch with bracket publish while preserving existing admin review and result desk behavior.

### Slice 3: Visual Bracket And Admin Seed Board

Add the admin seed board and shared Double Elim bracket renderer. Admin can see bracket health, current matches, unresolved slots, and completion path.

### Slice 4: Captain Path And History

Upgrade captain bracket/dashboard surfaces with current path, record, lower-bracket danger, elimination/champion states, and completed match history.

### Slice 5: Ranking Foundation

Add standings/ranking panels using the new standings table and completed match history. Keep ranking tournament-based, not ELO-based.

## Acceptance Criteria

- Admin can publish a Double Elimination bracket from approved or checked-in teams.
- The system creates upper bracket, lower bracket, and grand-final match slots.
- Byes are handled without manual admin edits.
- Completing a reported match advances winner and loser to the correct next slots.
- Losing twice eliminates a team.
- The Grand Final winner is marked champion unless a Reset Final is required.
- If the lower-bracket finalist wins Grand Final one, a Reset Final is created and decides champion.
- Captain pages show current match, bracket position, and match history.
- Admin pages show standings and bracket health.
- Existing check-in, report, dispute, reset, and complete flows keep working.
- The UI remains visually consistent with the current Valorant tactical theme.

## Open Decisions Locked For This Spec

- The first Grand Final uses one standard reset condition: only a lower-bracket finalist win creates the Reset Final.
- Seeding is deterministic and form-based, not drag-and-drop.
- Ranking is tournament-placement based, not ELO.
- Discord, proof uploads, and LFG stay out of scope until the later operations/social slice.
