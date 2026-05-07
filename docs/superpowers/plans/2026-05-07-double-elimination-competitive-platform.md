# Double Elimination Competitive Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real Valorant-style Double Elimination tournament platform with bracket publish, automatic advancement, standings, match history, and captain/admin bracket views.

**Architecture:** Start with pure bracket logic and tests, then add Drizzle schema, then wire server actions and queries, then build UI. Keep the bracket engine free of database imports so the risky tournament math is easy to test and reason about.

**Tech Stack:** Next.js App Router, React Server Components, Server Actions, Drizzle ORM, PostgreSQL, Auth.js, Tailwind CSS v4, lucide-react, Node `assert` tests through `pnpm exec tsx`.

---

## Scope Check

This plan implements one connected subsystem: Double Elimination bracket truth plus the minimal identity surfaces that depend on it. Discord, proof uploads, LFG, and ELO stay out of this plan. Public exposure is limited to read-only reuse of the bracket component on existing surfaces if route changes already touch those files.

## File Structure

- `src/features/brackets/types.ts`: pure data contracts for planned teams, bracket matches, advancement results, and bracket views.
- `src/features/brackets/double-elimination.ts`: pure bracket-size, seed-order, plan generation, and bye placement helpers.
- `src/features/brackets/double-elimination.test.ts`: unit coverage for seeds, byes, 2-team reset path, and lower bracket structure.
- `src/features/brackets/advancement.ts`: pure completion/advancement helper used by admin actions.
- `src/features/brackets/advancement.test.ts`: unit coverage for winner movement, loser drops, elimination, and finals reset.
- `src/db/schema.ts`: bracket metadata fields, bracket enums, standings table, player snapshot table, and relations.
- `src/features/brackets/actions.ts`: admin publish action and transactional bracket writing.
- `src/features/admin/actions.ts`: replace single-match placeholder launch with publish/advance flow; keep registration review, dispute reset, and result completion.
- `src/features/brackets/queries.ts`: bracket view, current match, team history, and standings queries.
- `src/features/tournaments/queries.ts`: admin seed board query and queue signal updates.
- `src/features/profiles/queries.ts`: user/team history foundation from snapshots and completed matches.
- `src/components/dashboard/seed-board.tsx`: admin publish surface.
- `src/components/dashboard/double-elim-bracket.tsx`: shared bracket renderer.
- `src/components/dashboard/player-history-panel.tsx`: record/history panel for captain surfaces.
- `src/app/(dashboard)/dashboard/admin/page.tsx`: add seed board and bracket health.
- `src/app/(dashboard)/dashboard/brackets/page.tsx`: show Double Elim bracket and captain path.
- `src/app/(dashboard)/dashboard/page.tsx`: add team record/current bracket path.
- `src/app/globals.css`: tactical bracket lanes, seed board, standings, and responsive bracket styles.

## Task 1: Bracket Contracts And Failing Generator Tests

**Files:**
- Create: `src/features/brackets/types.ts`
- Create: `src/features/brackets/double-elimination.test.ts`
- Test: `pnpm exec tsx src/features/brackets/double-elimination.test.ts`

- [ ] **Step 1: Create shared bracket types**

Create `src/features/brackets/types.ts`:

```ts
import type { Match, Team, TeamMember, TournamentRegistration } from "@/db/schema";

export type BracketLane = "upper" | "lower" | "grand_final" | "grand_final_reset";
export type BracketSlot = "team_a" | "team_b";
export type PlannedMatchStatus = Extract<Match["status"], "scheduled" | "ready" | "completed">;

export type EligibleBracketTeam = {
  registrationId: string;
  tournamentId: string;
  teamId: string;
  teamName: string;
  seed: number | null;
  status: TournamentRegistration["status"];
  checkedInAt: Date | null;
  createdAt: Date;
  members: Array<Pick<TeamMember, "userId" | "riotId" | "riotIdNormalized" | "role" | "isCaptain">>;
};

export type SeededBracketTeam = EligibleBracketTeam & {
  seed: number;
};

export type PlannedBracketMatch = {
  planId: string;
  bracket: BracketLane;
  bracketRound: number;
  bracketMatchNumber: number;
  displayRound: number;
  displayMatchNumber: number;
  bestOf: 1 | 3 | 5;
  status: PlannedMatchStatus;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  scoreA: number;
  scoreB: number;
  sourceMatchAPlanId: string | null;
  sourceMatchBPlanId: string | null;
  nextMatchPlanId: string | null;
  nextMatchSlot: BracketSlot | null;
  loserNextMatchPlanId: string | null;
  loserNextMatchSlot: BracketSlot | null;
};

export type PlannedStanding = {
  tournamentId: string;
  teamId: string;
  seed: number;
  wins: number;
  losses: number;
  status: "active" | "lower_bracket" | "eliminated" | "runner_up" | "champion";
  lastMatchPlanId: string | null;
};

export type PlannedPlayerSnapshot = {
  tournamentId: string;
  teamId: string;
  userId: string | null;
  riotId: string;
  riotIdNormalized: string;
  role: TeamMember["role"];
  isCaptain: boolean;
  seed: number;
};

export type DoubleEliminationPlan = {
  tournamentId: string;
  bracketSize: number;
  teams: SeededBracketTeam[];
  matches: PlannedBracketMatch[];
  standings: PlannedStanding[];
  playerSnapshots: PlannedPlayerSnapshot[];
  warnings: string[];
};

export type MatchWithTeams = Match & {
  teamA?: Team | null;
  teamB?: Team | null;
};
```

- [ ] **Step 2: Write failing generator tests**

Create `src/features/brackets/double-elimination.test.ts`:

```ts
import assert from "node:assert/strict";

import { createDoubleEliminationPlan, getSeedOrder, nextPowerOfTwo } from "./double-elimination";
import type { EligibleBracketTeam } from "./types";

const now = new Date("2026-05-07T18:00:00.000Z");

function team(index: number, seed: number | null = index): EligibleBracketTeam {
  return {
    registrationId: `registration-${index}`,
    tournamentId: "tournament-main",
    teamId: `team-${index}`,
    teamName: `Team ${index}`,
    seed,
    status: index % 2 === 0 ? "checked_in" : "approved",
    checkedInAt: index % 2 === 0 ? now : null,
    createdAt: new Date(now.getTime() + index * 1000),
    members: [
      {
        userId: `user-${index}`,
        riotId: `Player${index}#EUW`,
        riotIdNormalized: `player${index}#euw`,
        role: "starter",
        isCaptain: true,
      },
    ],
  };
}

assert.equal(nextPowerOfTwo(2), 2);
assert.equal(nextPowerOfTwo(6), 8);
assert.deepEqual(getSeedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);

const fourTeamPlan = createDoubleEliminationPlan({
  tournamentId: "tournament-main",
  teams: [team(1), team(2), team(3), team(4)],
});

assert.equal(fourTeamPlan.bracketSize, 4);
assert.equal(fourTeamPlan.matches.filter((match) => match.bracket === "upper").length, 3);
assert.equal(fourTeamPlan.matches.filter((match) => match.bracket === "lower").length, 2);
assert.equal(fourTeamPlan.matches.filter((match) => match.bracket === "grand_final").length, 1);
assert.equal(fourTeamPlan.standings.length, 4);
assert.equal(fourTeamPlan.playerSnapshots.length, 4);

const upperRoundOne = fourTeamPlan.matches.filter(
  (match) => match.bracket === "upper" && match.bracketRound === 1,
);
assert.deepEqual(
  upperRoundOne.map((match) => [match.teamAId, match.teamBId]),
  [
    ["team-1", "team-4"],
    ["team-2", "team-3"],
  ],
);

const sixTeamPlan = createDoubleEliminationPlan({
  tournamentId: "tournament-main",
  teams: [team(1), team(2), team(3), team(4), team(5), team(6)],
});

assert.equal(sixTeamPlan.bracketSize, 8);
assert.equal(
  sixTeamPlan.matches.filter((match) => match.status === "completed" && match.winnerTeamId).length,
  2,
);
assert.equal(sixTeamPlan.warnings.includes("Bracket expanded from 6 teams to 8 slots with 2 byes."), true);

const twoTeamPlan = createDoubleEliminationPlan({
  tournamentId: "tournament-main",
  teams: [team(1), team(2)],
});

const twoTeamUpper = twoTeamPlan.matches.find((match) => match.bracket === "upper");
const twoTeamGrandFinal = twoTeamPlan.matches.find((match) => match.bracket === "grand_final");
assert.ok(twoTeamUpper);
assert.ok(twoTeamGrandFinal);
assert.equal(twoTeamUpper.nextMatchPlanId, twoTeamGrandFinal.planId);
assert.equal(twoTeamUpper.loserNextMatchPlanId, twoTeamGrandFinal.planId);

assert.throws(
  () =>
    createDoubleEliminationPlan({
      tournamentId: "tournament-main",
      teams: [team(1)],
    }),
  /at least two/i,
);

console.log("double-elimination generator tests passed");
```

- [ ] **Step 3: Run the failing generator tests**

Run:

```bash
pnpm exec tsx src/features/brackets/double-elimination.test.ts
```

Expected: fail with a module-not-found error for `./double-elimination`.

- [ ] **Step 4: Commit failing tests**

```bash
git add src/features/brackets/types.ts src/features/brackets/double-elimination.test.ts
git commit -m "test: define double elimination bracket contract"
```

## Task 2: Pure Double Elimination Generator

**Files:**
- Create: `src/features/brackets/double-elimination.ts`
- Test: `pnpm exec tsx src/features/brackets/double-elimination.test.ts`

- [ ] **Step 1: Implement power, seed, and match helpers**

Create `src/features/brackets/double-elimination.ts` with these exports and helper contracts:

```ts
import type {
  BracketLane,
  BracketSlot,
  DoubleEliminationPlan,
  EligibleBracketTeam,
  PlannedBracketMatch,
  PlannedPlayerSnapshot,
  PlannedStanding,
  SeededBracketTeam,
} from "./types";

export function nextPowerOfTwo(value: number) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Bracket size input must be a positive integer.");
  }

  let size = 1;
  while (size < value) {
    size *= 2;
  }
  return size;
}

export function getSeedOrder(size: number): number[] {
  if (size < 2 || size % 2 !== 0) {
    throw new Error("Seed order size must be an even power-of-two value.");
  }

  let order = [1, 2];
  while (order.length < size) {
    const nextSize = order.length * 2;
    order = order.flatMap((seed) => [seed, nextSize + 1 - seed]);
  }
  return order;
}

function planId(bracket: BracketLane, round: number, number: number) {
  return `${bracket}-${round}-${number}`;
}

function slotForIndex(index: number): BracketSlot {
  return index % 2 === 0 ? "team_a" : "team_b";
}

function placeTeam(match: PlannedBracketMatch, slot: BracketSlot, teamId: string) {
  if (slot === "team_a") {
    match.teamAId = teamId;
    return;
  }
  match.teamBId = teamId;
}

function createMatch(input: {
  bracket: BracketLane;
  bracketRound: number;
  bracketMatchNumber: number;
  displayRound: number;
  displayMatchNumber: number;
  teamAId?: string | null;
  teamBId?: string | null;
}): PlannedBracketMatch {
  const teamAId = input.teamAId ?? null;
  const teamBId = input.teamBId ?? null;

  return {
    planId: planId(input.bracket, input.bracketRound, input.bracketMatchNumber),
    bracket: input.bracket,
    bracketRound: input.bracketRound,
    bracketMatchNumber: input.bracketMatchNumber,
    displayRound: input.displayRound,
    displayMatchNumber: input.displayMatchNumber,
    bestOf: input.bracket === "grand_final" || input.bracket === "grand_final_reset" ? 3 : 1,
    status: teamAId && teamBId ? "ready" : "scheduled",
    teamAId,
    teamBId,
    winnerTeamId: null,
    scoreA: 0,
    scoreB: 0,
    sourceMatchAPlanId: null,
    sourceMatchBPlanId: null,
    nextMatchPlanId: null,
    nextMatchSlot: null,
    loserNextMatchPlanId: null,
    loserNextMatchSlot: null,
  };
}
```

- [ ] **Step 2: Implement seed normalization and snapshot helpers**

Add this below the helper block:

```ts
function normalizeTeams(teams: EligibleBracketTeam[]): SeededBracketTeam[] {
  if (teams.length < 2) {
    throw new Error("Double elimination requires at least two eligible teams.");
  }

  const usedSeeds = new Set<number>();
  const normalized: SeededBracketTeam[] = [];
  const sorted = [...teams].sort((a, b) => {
    const aSeed = a.seed ?? Number.MAX_SAFE_INTEGER;
    const bSeed = b.seed ?? Number.MAX_SAFE_INTEGER;
    if (aSeed !== bSeed) {
      return aSeed - bSeed;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  for (const entry of sorted) {
    let seed = entry.seed ?? 1;
    while (usedSeeds.has(seed)) {
      seed += 1;
    }
    usedSeeds.add(seed);
    normalized.push({ ...entry, seed });
  }

  return normalized.sort((a, b) => a.seed - b.seed);
}

function buildStandings(tournamentId: string, teams: SeededBracketTeam[]): PlannedStanding[] {
  return teams.map((team) => ({
    tournamentId,
    teamId: team.teamId,
    seed: team.seed,
    wins: 0,
    losses: 0,
    status: "active",
    lastMatchPlanId: null,
  }));
}

function buildPlayerSnapshots(tournamentId: string, teams: SeededBracketTeam[]): PlannedPlayerSnapshot[] {
  return teams.flatMap((team) =>
    team.members.map((member) => ({
      tournamentId,
      teamId: team.teamId,
      userId: member.userId,
      riotId: member.riotId,
      riotIdNormalized: member.riotIdNormalized,
      role: member.role,
      isCaptain: member.isCaptain,
      seed: team.seed,
    })),
  );
}
```

- [ ] **Step 3: Implement `createDoubleEliminationPlan`**

Add this public function. Keep the lower bracket deterministic: L1 receives upper R1 losers in seed-pair order; each following drop round receives prior lower winners plus upper losers; each compression round pairs lower winners.

```ts
export function createDoubleEliminationPlan(input: {
  tournamentId: string;
  teams: EligibleBracketTeam[];
}): DoubleEliminationPlan {
  const teams = normalizeTeams(input.teams);
  const bracketSize = nextPowerOfTwo(teams.length);
  const warnings =
    bracketSize === teams.length
      ? []
      : [`Bracket expanded from ${teams.length} teams to ${bracketSize} slots with ${bracketSize - teams.length} byes.`];
  const seededBySeed = new Map(teams.map((team) => [team.seed, team]));
  const seedOrder = getSeedOrder(bracketSize);
  const matches: PlannedBracketMatch[] = [];
  const byPlanId = new Map<string, PlannedBracketMatch>();

  function add(match: PlannedBracketMatch) {
    matches.push(match);
    byPlanId.set(match.planId, match);
    return match;
  }

  if (bracketSize === 2) {
    const first = add(
      createMatch({
        bracket: "upper",
        bracketRound: 1,
        bracketMatchNumber: 1,
        displayRound: 1,
        displayMatchNumber: 1,
        teamAId: seedOrder[0] ? seededBySeed.get(seedOrder[0])?.teamId ?? null : null,
        teamBId: seedOrder[1] ? seededBySeed.get(seedOrder[1])?.teamId ?? null : null,
      }),
    );
    const grand = add(
      createMatch({
        bracket: "grand_final",
        bracketRound: 1,
        bracketMatchNumber: 1,
        displayRound: 2,
        displayMatchNumber: 1,
      }),
    );
    first.nextMatchPlanId = grand.planId;
    first.nextMatchSlot = "team_a";
    first.loserNextMatchPlanId = grand.planId;
    first.loserNextMatchSlot = "team_b";

    return {
      tournamentId: input.tournamentId,
      bracketSize,
      teams,
      matches,
      standings: buildStandings(input.tournamentId, teams),
      playerSnapshots: buildPlayerSnapshots(input.tournamentId, teams),
      warnings,
    };
  }

  const upperRounds = Math.log2(bracketSize);
  let displayMatchNumber = 1;

  for (let round = 1; round <= upperRounds; round += 1) {
    const matchCount = bracketSize / 2 ** round;
    for (let number = 1; number <= matchCount; number += 1) {
      const orderIndex = (number - 1) * 2;
      const match = add(
        createMatch({
          bracket: "upper",
          bracketRound: round,
          bracketMatchNumber: number,
          displayRound: round,
          displayMatchNumber: displayMatchNumber++,
          teamAId: round === 1 ? seededBySeed.get(seedOrder[orderIndex] ?? 0)?.teamId ?? null : null,
          teamBId: round === 1 ? seededBySeed.get(seedOrder[orderIndex + 1] ?? 0)?.teamId ?? null : null,
        }),
      );

      if (round > 1) {
        const sourceA = byPlanId.get(planId("upper", round - 1, number * 2 - 1));
        const sourceB = byPlanId.get(planId("upper", round - 1, number * 2));
        if (sourceA) {
          sourceA.nextMatchPlanId = match.planId;
          sourceA.nextMatchSlot = "team_a";
          match.sourceMatchAPlanId = sourceA.planId;
        }
        if (sourceB) {
          sourceB.nextMatchPlanId = match.planId;
          sourceB.nextMatchSlot = "team_b";
          match.sourceMatchBPlanId = sourceB.planId;
        }
      }
    }
  }

  const lowerRoundCount = 2 * (upperRounds - 1);
  for (let lowerRound = 1; lowerRound <= lowerRoundCount; lowerRound += 1) {
    const isDropRound = lowerRound === 1 || lowerRound % 2 === 0;
    const upperDropRound = lowerRound === 1 ? 1 : lowerRound / 2 + 1;
    const matchCount =
      lowerRound === 1
        ? bracketSize / 4
        : isDropRound
          ? bracketSize / 2 ** upperDropRound
          : bracketSize / 2 ** ((lowerRound + 3) / 2);

    for (let number = 1; number <= matchCount; number += 1) {
      add(
        createMatch({
          bracket: "lower",
          bracketRound: lowerRound,
          bracketMatchNumber: number,
          displayRound: upperRounds + lowerRound,
          displayMatchNumber: displayMatchNumber++,
        }),
      );
    }
  }

  const grandFinal = add(
    createMatch({
      bracket: "grand_final",
      bracketRound: 1,
      bracketMatchNumber: 1,
      displayRound: upperRounds + lowerRoundCount + 1,
      displayMatchNumber: displayMatchNumber++,
    }),
  );

  connectLowerBracket(byPlanId, bracketSize, upperRounds, grandFinal.planId);
  applyByes(matches, byPlanId);

  return {
    tournamentId: input.tournamentId,
    bracketSize,
    teams,
    matches,
    standings: buildStandings(input.tournamentId, teams),
    playerSnapshots: buildPlayerSnapshots(input.tournamentId, teams),
    warnings,
  };
}
```

- [ ] **Step 4: Implement lower connections and bye placement**

Add these private helpers under the public function:

```ts
function connectLowerBracket(
  byPlanId: Map<string, PlannedBracketMatch>,
  bracketSize: number,
  upperRounds: number,
  grandFinalPlanId: string,
) {
  const upperFinal = byPlanId.get(planId("upper", upperRounds, 1));
  if (upperFinal) {
    upperFinal.nextMatchPlanId = grandFinalPlanId;
    upperFinal.nextMatchSlot = "team_a";
    upperFinal.loserNextMatchPlanId = planId("lower", 2 * (upperRounds - 1), 1);
    upperFinal.loserNextMatchSlot = "team_b";
  }

  const lowerFinal = byPlanId.get(planId("lower", 2 * (upperRounds - 1), 1));
  if (lowerFinal) {
    lowerFinal.nextMatchPlanId = grandFinalPlanId;
    lowerFinal.nextMatchSlot = "team_b";
  }

  const previousLowerBeforeFinal = byPlanId.get(planId("lower", 2 * (upperRounds - 1) - 1, 1));
  if (previousLowerBeforeFinal && lowerFinal) {
    previousLowerBeforeFinal.nextMatchPlanId = lowerFinal.planId;
    previousLowerBeforeFinal.nextMatchSlot = "team_a";
    lowerFinal.sourceMatchAPlanId = previousLowerBeforeFinal.planId;
  }

  const upperRoundOneCount = bracketSize / 2;
  for (let index = 0; index < upperRoundOneCount; index += 1) {
    const upper = byPlanId.get(planId("upper", 1, index + 1));
    const lower = byPlanId.get(planId("lower", 1, Math.floor(index / 2) + 1));
    if (upper && lower) {
      upper.loserNextMatchPlanId = lower.planId;
      upper.loserNextMatchSlot = slotForIndex(index);
    }
  }

  for (let upperRound = 2; upperRound < upperRounds; upperRound += 1) {
    const dropLowerRound = 2 * upperRound - 2;
    const compressionLowerRound = dropLowerRound + 1;
    const dropCount = bracketSize / 2 ** upperRound;

    for (let number = 1; number <= dropCount; number += 1) {
      const upper = byPlanId.get(planId("upper", upperRound, number));
      const drop = byPlanId.get(planId("lower", dropLowerRound, number));
      const previous = byPlanId.get(planId("lower", dropLowerRound - 1, number));

      if (previous && drop) {
        previous.nextMatchPlanId = drop.planId;
        previous.nextMatchSlot = "team_a";
        drop.sourceMatchAPlanId = previous.planId;
      }

      if (upper && drop) {
        upper.loserNextMatchPlanId = drop.planId;
        upper.loserNextMatchSlot = "team_b";
        drop.sourceMatchBPlanId = upper.planId;
      }
    }

    for (let index = 0; index < dropCount; index += 1) {
      const drop = byPlanId.get(planId("lower", dropLowerRound, index + 1));
      const compression = byPlanId.get(planId("lower", compressionLowerRound, Math.floor(index / 2) + 1));
      if (drop && compression) {
        drop.nextMatchPlanId = compression.planId;
        drop.nextMatchSlot = slotForIndex(index);
      }
    }
  }
}

function applyByes(matches: PlannedBracketMatch[], byPlanId: Map<string, PlannedBracketMatch>) {
  let changed = true;

  while (changed) {
    changed = false;

    for (const match of matches) {
      if (match.bracket !== "upper" || match.status === "completed") {
        continue;
      }

      const onlyTeam = match.teamAId && !match.teamBId ? match.teamAId : match.teamBId && !match.teamAId ? match.teamBId : null;
      if (!onlyTeam || !match.nextMatchPlanId || !match.nextMatchSlot) {
        continue;
      }

      match.status = "completed";
      match.winnerTeamId = onlyTeam;
      match.scoreA = match.teamAId === onlyTeam ? 1 : 0;
      match.scoreB = match.teamBId === onlyTeam ? 1 : 0;

      const target = byPlanId.get(match.nextMatchPlanId);
      if (target) {
        placeTeam(target, match.nextMatchSlot, onlyTeam);
        target.status = target.teamAId && target.teamBId ? "ready" : "scheduled";
      }

      changed = true;
    }
  }
}
```

- [ ] **Step 5: Run generator tests**

Run:

```bash
pnpm exec tsx src/features/brackets/double-elimination.test.ts
pnpm typecheck
```

Expected: generator tests print `double-elimination generator tests passed`; typecheck passes.

- [ ] **Step 6: Commit generator**

```bash
git add src/features/brackets/double-elimination.ts src/features/brackets/double-elimination.test.ts
git commit -m "feat: generate double elimination brackets"
```

## Task 3: Pure Advancement Rules

**Files:**
- Create: `src/features/brackets/advancement.ts`
- Create: `src/features/brackets/advancement.test.ts`
- Test: `pnpm exec tsx src/features/brackets/advancement.test.ts`

- [ ] **Step 1: Write failing advancement tests**

Create `src/features/brackets/advancement.test.ts`:

```ts
import assert from "node:assert/strict";

import { resolveMatchAdvancement } from "./advancement";

const baseMatch = {
  id: "match-1",
  status: "reported" as const,
  teamAId: "team-a",
  teamBId: "team-b",
  winnerTeamId: "team-a",
  scoreA: 1,
  scoreB: 0,
  bracket: "upper" as const,
  nextMatchId: "upper-final",
  nextMatchSlot: "team_a" as const,
  loserNextMatchId: "lower-1",
  loserNextMatchSlot: "team_b" as const,
};

assert.deepEqual(resolveMatchAdvancement(baseMatch), {
  completedMatch: { status: "completed", winnerTeamId: "team-a", scoreA: 1, scoreB: 0 },
  winnerMove: { matchId: "upper-final", slot: "team_a", teamId: "team-a" },
  loserMove: { matchId: "lower-1", slot: "team_b", teamId: "team-b" },
  createResetFinal: false,
  championTeamId: null,
  runnerUpTeamId: null,
});

assert.deepEqual(
  resolveMatchAdvancement({
    ...baseMatch,
    bracket: "grand_final",
    nextMatchId: null,
    nextMatchSlot: null,
    loserNextMatchId: null,
    loserNextMatchSlot: null,
    teamAId: "upper-winner",
    teamBId: "lower-winner",
    winnerTeamId: "upper-winner",
  }).championTeamId,
  "upper-winner",
);

const reset = resolveMatchAdvancement({
  ...baseMatch,
  bracket: "grand_final",
  nextMatchId: null,
  nextMatchSlot: null,
  loserNextMatchId: null,
  loserNextMatchSlot: null,
  teamAId: "upper-winner",
  teamBId: "lower-winner",
  winnerTeamId: "lower-winner",
});
assert.equal(reset.createResetFinal, true);
assert.equal(reset.championTeamId, null);

assert.throws(
  () => resolveMatchAdvancement({ ...baseMatch, status: "disputed" }),
  /reported/i,
);

assert.throws(
  () => resolveMatchAdvancement({ ...baseMatch, winnerTeamId: "outsider" }),
  /winner/i,
);

console.log("double-elimination advancement tests passed");
```

- [ ] **Step 2: Run failing advancement tests**

Run:

```bash
pnpm exec tsx src/features/brackets/advancement.test.ts
```

Expected: fail with a module-not-found error for `./advancement`.

- [ ] **Step 3: Implement advancement helper**

Create `src/features/brackets/advancement.ts`:

```ts
import type { BracketLane, BracketSlot } from "./types";

export type AdvancementMatchInput = {
  id: string;
  status: "scheduled" | "ready" | "live" | "reported" | "disputed" | "completed";
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  scoreA: number;
  scoreB: number;
  bracket: BracketLane | null;
  nextMatchId: string | null;
  nextMatchSlot: BracketSlot | null;
  loserNextMatchId: string | null;
  loserNextMatchSlot: BracketSlot | null;
};

export type TeamMove = {
  matchId: string;
  slot: BracketSlot;
  teamId: string;
};

export type MatchAdvancement = {
  completedMatch: {
    status: "completed";
    winnerTeamId: string;
    scoreA: number;
    scoreB: number;
  };
  winnerMove: TeamMove | null;
  loserMove: TeamMove | null;
  createResetFinal: boolean;
  championTeamId: string | null;
  runnerUpTeamId: string | null;
};

export function resolveMatchAdvancement(match: AdvancementMatchInput): MatchAdvancement {
  if (match.status !== "reported") {
    throw new Error("Only a reported match can advance.");
  }

  if (!match.teamAId || !match.teamBId) {
    throw new Error("A match needs both teams before advancement.");
  }

  if (!match.winnerTeamId || (match.winnerTeamId !== match.teamAId && match.winnerTeamId !== match.teamBId)) {
    throw new Error("The reported winner must belong to this match.");
  }

  const loserTeamId = match.winnerTeamId === match.teamAId ? match.teamBId : match.teamAId;
  const completedMatch = {
    status: "completed" as const,
    winnerTeamId: match.winnerTeamId,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
  };

  if (match.bracket === "grand_final") {
    const upperFinalistWon = match.winnerTeamId === match.teamAId;
    return {
      completedMatch,
      winnerMove: null,
      loserMove: null,
      createResetFinal: !upperFinalistWon,
      championTeamId: upperFinalistWon ? match.winnerTeamId : null,
      runnerUpTeamId: upperFinalistWon ? loserTeamId : null,
    };
  }

  if (match.bracket === "grand_final_reset") {
    return {
      completedMatch,
      winnerMove: null,
      loserMove: null,
      createResetFinal: false,
      championTeamId: match.winnerTeamId,
      runnerUpTeamId: loserTeamId,
    };
  }

  return {
    completedMatch,
    winnerMove:
      match.nextMatchId && match.nextMatchSlot
        ? { matchId: match.nextMatchId, slot: match.nextMatchSlot, teamId: match.winnerTeamId }
        : null,
    loserMove:
      match.loserNextMatchId && match.loserNextMatchSlot
        ? { matchId: match.loserNextMatchId, slot: match.loserNextMatchSlot, teamId: loserTeamId }
        : null,
    createResetFinal: false,
    championTeamId: null,
    runnerUpTeamId: null,
  };
}
```

- [ ] **Step 4: Run advancement tests**

Run:

```bash
pnpm exec tsx src/features/brackets/advancement.test.ts
pnpm typecheck
```

Expected: advancement tests print `double-elimination advancement tests passed`; typecheck passes.

- [ ] **Step 5: Commit advancement helper**

```bash
git add src/features/brackets/advancement.ts src/features/brackets/advancement.test.ts
git commit -m "feat: resolve double elimination advancement"
```

## Task 4: Drizzle Schema And Migration

**Files:**
- Modify: `src/db/schema.ts`
- Generate: `drizzle/migrations/*`
- Test: `pnpm db:generate`, `pnpm typecheck`

- [ ] **Step 1: Add enum declarations**

Modify the `drizzle-orm/pg-core` import to include `type AnyPgColumn`:

```ts
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
```

Add these enums after `matchStatusEnum`:

```ts
export const bracketLaneEnum = pgEnum("bracket_lane", [
  "upper",
  "lower",
  "grand_final",
  "grand_final_reset",
]);

export const bracketSlotEnum = pgEnum("bracket_slot", ["team_a", "team_b"]);

export const tournamentStandingStatusEnum = pgEnum("tournament_standing_status", [
  "active",
  "lower_bracket",
  "eliminated",
  "runner_up",
  "champion",
]);
```

- [ ] **Step 2: Add bracket metadata to `matches`**

Inside the `matches` table definition, after `bestOf`, add:

```ts
bracket: bracketLaneEnum("bracket"),
bracketRound: integer("bracket_round"),
bracketMatchNumber: integer("bracket_match_number"),
nextMatchId: uuid("next_match_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
nextMatchSlot: bracketSlotEnum("next_match_slot"),
loserNextMatchId: uuid("loser_next_match_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
loserNextMatchSlot: bracketSlotEnum("loser_next_match_slot"),
sourceMatchAId: uuid("source_match_a_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
sourceMatchBId: uuid("source_match_b_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
```

In the matches indexes array, add:

```ts
index("matches_bracket_position_idx").on(table.tournamentId, table.bracket, table.bracketRound, table.bracketMatchNumber),
index("matches_next_match_idx").on(table.nextMatchId),
index("matches_loser_next_match_idx").on(table.loserNextMatchId),
```

- [ ] **Step 3: Add standings and snapshot tables**

Add after `matches`:

```ts
export const tournamentTeamStandings = pgTable(
  "tournament_team_standings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    seed: integer("seed").notNull(),
    wins: integer("wins").default(0).notNull(),
    losses: integer("losses").default(0).notNull(),
    status: tournamentStandingStatusEnum("status").default("active").notNull(),
    lastMatchId: uuid("last_match_id").references(() => matches.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tournament_team_standings_team_unique").on(table.tournamentId, table.teamId),
    index("tournament_team_standings_rank_idx").on(table.tournamentId, table.status, table.wins, table.losses, table.seed),
  ],
);

export const tournamentPlayerSnapshots = pgTable(
  "tournament_player_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    riotId: varchar("riot_id", { length: 32 }).notNull(),
    riotIdNormalized: varchar("riot_id_normalized", { length: 64 }).notNull(),
    role: rosterRoleEnum("role").notNull(),
    isCaptain: boolean("is_captain").default(false).notNull(),
    seed: integer("seed").notNull(),
    ...timestamps,
  },
  (table) => [
    index("tournament_player_snapshots_tournament_idx").on(table.tournamentId),
    index("tournament_player_snapshots_user_idx").on(table.userId),
    index("tournament_player_snapshots_riot_idx").on(table.riotIdNormalized),
  ],
);
```

- [ ] **Step 4: Add relations and exports**

Add relations:

```ts
export const tournamentTeamStandingsRelations = relations(tournamentTeamStandings, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentTeamStandings.tournamentId],
    references: [tournaments.id],
  }),
  team: one(teams, {
    fields: [tournamentTeamStandings.teamId],
    references: [teams.id],
  }),
  lastMatch: one(matches, {
    fields: [tournamentTeamStandings.lastMatchId],
    references: [matches.id],
  }),
}));

export const tournamentPlayerSnapshotsRelations = relations(tournamentPlayerSnapshots, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentPlayerSnapshots.tournamentId],
    references: [tournaments.id],
  }),
  team: one(teams, {
    fields: [tournamentPlayerSnapshots.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [tournamentPlayerSnapshots.userId],
    references: [users.id],
  }),
}));
```

Add type exports:

```ts
export type TournamentTeamStanding = typeof tournamentTeamStandings.$inferSelect;
export type NewTournamentTeamStanding = typeof tournamentTeamStandings.$inferInsert;
export type TournamentPlayerSnapshot = typeof tournamentPlayerSnapshots.$inferSelect;
export type NewTournamentPlayerSnapshot = typeof tournamentPlayerSnapshots.$inferInsert;
```

- [ ] **Step 5: Generate migration and typecheck**

Run:

```bash
pnpm db:generate
pnpm typecheck
```

Expected: Drizzle creates one migration under `drizzle/migrations`; typecheck passes.

- [ ] **Step 6: Commit schema and migration**

```bash
git add src/db/schema.ts drizzle/migrations
git commit -m "feat: add double elimination schema"
```

## Task 5: Bracket Publish And Advancement Server Actions

**Files:**
- Create: `src/features/brackets/actions.ts`
- Modify: `src/features/admin/actions.ts`
- Modify: `src/features/admin/match-review.ts`
- Modify: `src/features/tournaments/queries.ts`
- Test: `pnpm typecheck`

- [ ] **Step 1: Add admin seed-board query**

In `src/features/tournaments/queries.ts`, add a query that returns eligible teams with members:

Also add `tournamentId: tournaments.id` to the existing `getAdminRegistrationQueue()` select so the admin page can resolve the active tournament from either the seed board or the queue:

```ts
tournamentId: tournaments.id,
```

```ts
export async function getAdminSeedBoard(tournamentId?: string) {
  const registrations = await db.query.tournamentRegistrations.findMany({
    where: or(eq(tournamentRegistrations.status, "approved"), eq(tournamentRegistrations.status, "checked_in")),
    orderBy: asc(tournamentRegistrations.createdAt),
    with: {
      team: {
        with: {
          members: true,
        },
      },
      tournament: true,
    },
  });

  return registrations
    .filter((registration) => !tournamentId || registration.tournamentId === tournamentId)
    .map((registration) => ({
      registrationId: registration.id,
      tournamentId: registration.tournamentId,
      tournamentTitle: registration.tournament.title,
      teamId: registration.teamId,
      teamName: registration.team.name,
      seed: registration.seed,
      status: registration.status,
      checkedInAt: registration.checkedInAt,
      createdAt: registration.createdAt,
      members: registration.team.members,
    }));
}
```

- [ ] **Step 2: Implement publish action shell**

Create `src/features/brackets/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  matches,
  tournamentPlayerSnapshots,
  tournamentRegistrations,
  tournamentTeamStandings,
} from "@/db/schema";

import { createDoubleEliminationPlan } from "./double-elimination";
import type { EligibleBracketTeam, PlannedBracketMatch } from "./types";

export type PublishBracketResult =
  | { ok: true; matchCount: number; warnings: string[] }
  | { ok: false; error: string };

export async function publishDoubleEliminationBracket(formData: FormData): Promise<PublishBracketResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { ok: false, error: "Admin access is required to publish a bracket." };
  }

  const tournamentId = formData.get("tournamentId");
  if (typeof tournamentId !== "string") {
    return { ok: false, error: "Tournament id is required." };
  }

  const existing = await db.query.matches.findFirst({
    where: eq(matches.tournamentId, tournamentId),
  });
  if (existing) {
    return { ok: false, error: "This tournament already has bracket matches." };
  }

  let plan;

  try {
    const eligible = await loadEligibleBracketTeams(tournamentId);
    plan = createDoubleEliminationPlan({ tournamentId, teams: eligible });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Bracket generation failed.",
    };
  }

  await db.transaction(async (tx) => {
    const insertedIds = new Map<string, string>();

    for (const planned of plan.matches) {
      const [created] = await tx
        .insert(matches)
        .values(toMatchInsert(tournamentId, planned))
        .returning({ id: matches.id });
      if (!created) {
        throw new Error("Match insert failed.");
      }
      insertedIds.set(planned.planId, created.id);
    }

    for (const planned of plan.matches) {
      const matchId = insertedIds.get(planned.planId);
      if (!matchId) {
        throw new Error("Missing inserted match id.");
      }

      await tx
        .update(matches)
        .set({
          nextMatchId: planned.nextMatchPlanId ? insertedIds.get(planned.nextMatchPlanId) ?? null : null,
          loserNextMatchId: planned.loserNextMatchPlanId ? insertedIds.get(planned.loserNextMatchPlanId) ?? null : null,
          sourceMatchAId: planned.sourceMatchAPlanId ? insertedIds.get(planned.sourceMatchAPlanId) ?? null : null,
          sourceMatchBId: planned.sourceMatchBPlanId ? insertedIds.get(planned.sourceMatchBPlanId) ?? null : null,
        })
        .where(eq(matches.id, matchId));
    }

    await tx.insert(tournamentTeamStandings).values(
      plan.standings.map((standing) => ({
        tournamentId: standing.tournamentId,
        teamId: standing.teamId,
        seed: standing.seed,
        wins: standing.wins,
        losses: standing.losses,
        status: standing.status,
        lastMatchId: standing.lastMatchPlanId ? insertedIds.get(standing.lastMatchPlanId) ?? null : null,
      })),
    );

    if (plan.playerSnapshots.length) {
      await tx.insert(tournamentPlayerSnapshots).values(plan.playerSnapshots);
    }

    for (const team of plan.teams) {
      await tx
        .update(tournamentRegistrations)
        .set({ seed: team.seed, updatedAt: new Date() })
        .where(eq(tournamentRegistrations.id, team.registrationId));
    }
  });

  revalidateTournamentBracket();
  return { ok: true, matchCount: plan.matches.length, warnings: plan.warnings };
}

async function loadEligibleBracketTeams(tournamentId: string): Promise<EligibleBracketTeam[]> {
  const registrations = await db.query.tournamentRegistrations.findMany({
    where: eq(tournamentRegistrations.tournamentId, tournamentId),
    orderBy: asc(tournamentRegistrations.createdAt),
    with: {
      team: {
        with: {
          members: true,
        },
      },
    },
  });

  const eligible = registrations.filter(
    (registration) => registration.status === "approved" || registration.status === "checked_in",
  );

  if (eligible.length < 2) {
    throw new Error("At least two approved or checked-in teams are required.");
  }

  return eligible.map((registration) => ({
    registrationId: registration.id,
    tournamentId: registration.tournamentId,
    teamId: registration.teamId,
    teamName: registration.team.name,
    seed: registration.seed,
    status: registration.status,
    checkedInAt: registration.checkedInAt,
    createdAt: registration.createdAt,
    members: registration.team.members,
  }));
}

function toMatchInsert(tournamentId: string, planned: PlannedBracketMatch) {
  return {
    tournamentId,
    round: planned.displayRound,
    matchNumber: planned.displayMatchNumber,
    bestOf: planned.bestOf,
    bracket: planned.bracket,
    bracketRound: planned.bracketRound,
    bracketMatchNumber: planned.bracketMatchNumber,
    teamAId: planned.teamAId,
    teamBId: planned.teamBId,
    winnerTeamId: planned.winnerTeamId,
    status: planned.status,
    scoreA: planned.scoreA,
    scoreB: planned.scoreB,
    nextMatchSlot: planned.nextMatchSlot,
    loserNextMatchSlot: planned.loserNextMatchSlot,
  };
}

function revalidateTournamentBracket() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/brackets");
  revalidatePath("/dashboard/roster");
  revalidatePath("/");
}
```

- [ ] **Step 3: Lint the new publish action**

After adding the file, run ESLint so import mistakes or server-action syntax errors surface immediately.

Run:

```bash
pnpm lint
```

Expected: no unused import errors in `src/features/brackets/actions.ts`.

- [ ] **Step 4: Wire admin completion through advancement helper**

In `src/features/admin/actions.ts`, update `reviewAdminMatch` so `complete` uses `resolveMatchAdvancement()` after the existing match load. Select bracket metadata fields and wrap updates in a transaction:

Update the schema import in that file to include `tournamentTeamStandings` and `tournaments`, and add `resolveMatchAdvancement` from `@/features/brackets/advancement`.

```ts
const [match] = await db
  .select({
    id: matches.id,
    status: matches.status,
    teamAId: matches.teamAId,
    teamBId: matches.teamBId,
    winnerTeamId: matches.winnerTeamId,
    scoreA: matches.scoreA,
    scoreB: matches.scoreB,
    bracket: matches.bracket,
    nextMatchId: matches.nextMatchId,
    nextMatchSlot: matches.nextMatchSlot,
    loserNextMatchId: matches.loserNextMatchId,
    loserNextMatchSlot: matches.loserNextMatchSlot,
    tournamentId: matches.tournamentId,
    round: matches.round,
    matchNumber: matches.matchNumber,
  })
  .from(matches)
  .where(eq(matches.id, matchId))
  .limit(1);
```

Use this transaction for `decision === "complete"`:

```ts
const advancement = resolveMatchAdvancement(match);
const now = new Date();

await db.transaction(async (tx) => {
  await tx.update(matches).set({ ...advancement.completedMatch, updatedAt: now }).where(eq(matches.id, match.id));

  if (advancement.winnerMove) {
    await moveTeamIntoMatch(tx, advancement.winnerMove.matchId, advancement.winnerMove.slot, advancement.winnerMove.teamId, now);
  }

  if (advancement.loserMove) {
    await moveTeamIntoMatch(tx, advancement.loserMove.matchId, advancement.loserMove.slot, advancement.loserMove.teamId, now);
  }

  await incrementStanding(tx, match.tournamentId, advancement.completedMatch.winnerTeamId, "win", match.id, now);
  const loserTeamId = match.teamAId === advancement.completedMatch.winnerTeamId ? match.teamBId : match.teamAId;
  if (loserTeamId) {
    await incrementStanding(tx, match.tournamentId, loserTeamId, "loss", match.id, now);
  }

  if (advancement.createResetFinal && match.teamAId && match.teamBId) {
    await tx.insert(matches).values({
      tournamentId: match.tournamentId,
      round: match.round + 1,
      matchNumber: match.matchNumber + 1,
      bestOf: 3,
      bracket: "grand_final_reset",
      bracketRound: 1,
      bracketMatchNumber: 1,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      status: "ready",
      scheduledAt: new Date(now.getTime() + 60 * 60 * 1000),
    });
  }

  if (advancement.championTeamId) {
    await markChampion(tx, match.tournamentId, advancement.championTeamId, advancement.runnerUpTeamId, now);
  }
});
```

Implement local helpers in `src/features/admin/actions.ts`:

```ts
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function moveTeamIntoMatch(tx: Transaction, matchId: string, slot: "team_a" | "team_b", teamId: string, updatedAt: Date) {
  const values = slot === "team_a" ? { teamAId: teamId, updatedAt } : { teamBId: teamId, updatedAt };
  await tx.update(matches).set(values).where(eq(matches.id, matchId));

  const target = await tx.query.matches.findFirst({ where: eq(matches.id, matchId) });
  if (target?.teamAId && target.teamBId) {
    await tx.update(matches).set({ status: "ready", updatedAt }).where(eq(matches.id, matchId));
  }
}

async function incrementStanding(
  tx: Transaction,
  tournamentId: string,
  teamId: string,
  kind: "win" | "loss",
  matchId: string,
  updatedAt: Date,
) {
  const [standing] = await tx
    .select({
      wins: tournamentTeamStandings.wins,
      losses: tournamentTeamStandings.losses,
    })
    .from(tournamentTeamStandings)
    .where(and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, teamId)))
    .limit(1);

  if (!standing) {
    return;
  }

  const wins = kind === "win" ? standing.wins + 1 : standing.wins;
  const losses = kind === "loss" ? standing.losses + 1 : standing.losses;
  const status = losses >= 2 ? "eliminated" : losses === 1 ? "lower_bracket" : "active";

  await tx
    .update(tournamentTeamStandings)
    .set({ wins, losses, status, lastMatchId: matchId, updatedAt })
    .where(and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, teamId)));
}

async function markChampion(
  tx: Transaction,
  tournamentId: string,
  championTeamId: string,
  runnerUpTeamId: string | null,
  updatedAt: Date,
) {
  await tx
    .update(tournamentTeamStandings)
    .set({ status: "champion", updatedAt })
    .where(and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, championTeamId)));

  await tx
    .update(tournaments)
    .set({ status: "completed", updatedAt })
    .where(eq(tournaments.id, tournamentId));

  if (runnerUpTeamId) {
    await tx
      .update(tournamentTeamStandings)
      .set({ status: "runner_up", updatedAt })
      .where(and(eq(tournamentTeamStandings.tournamentId, tournamentId), eq(tournamentTeamStandings.teamId, runnerUpTeamId)));
  }
}
```

- [ ] **Step 5: Typecheck server actions**

Run:

```bash
pnpm typecheck
pnpm lint
```

Expected: both pass. If the transaction helper type is too narrow for Drizzle, replace the explicit `Transaction` type with local helper functions inside the transaction callback so `tx` is inferred.

- [ ] **Step 6: Commit actions and queries**

```bash
git add src/features/brackets/actions.ts src/features/admin/actions.ts src/features/admin/match-review.ts src/features/tournaments/queries.ts
git commit -m "feat: publish and advance double elimination brackets"
```

## Task 6: Bracket Queries, Admin Seed Board, And Visual Bracket

**Files:**
- Modify: `src/features/brackets/queries.ts`
- Create: `src/components/dashboard/seed-board.tsx`
- Create: `src/components/dashboard/double-elim-bracket.tsx`
- Modify: `src/app/(dashboard)/dashboard/admin/page.tsx`
- Modify: `src/app/globals.css`
- Test: `pnpm typecheck`

- [ ] **Step 1: Add bracket view queries**

In `src/features/brackets/queries.ts`, add:

```ts
export async function getTournamentBracket(tournamentId: string) {
  return db.query.matches.findMany({
    where: eq(matches.tournamentId, tournamentId),
    orderBy: [asc(matches.round), asc(matches.matchNumber)],
    with: {
      teamA: true,
      teamB: true,
      winner: true,
    },
  });
}

export async function getTeamStanding(tournamentId: string, teamId: string) {
  return db.query.tournamentTeamStandings.findFirst({
    where: and(
      eq(tournamentTeamStandings.tournamentId, tournamentId),
      eq(tournamentTeamStandings.teamId, teamId),
    ),
    with: {
      team: true,
    },
  });
}

export async function getTournamentStandings(tournamentId: string) {
  return db.query.tournamentTeamStandings.findMany({
    where: eq(tournamentTeamStandings.tournamentId, tournamentId),
    orderBy: [
      asc(tournamentTeamStandings.status),
      desc(tournamentTeamStandings.wins),
      asc(tournamentTeamStandings.losses),
      asc(tournamentTeamStandings.seed),
    ],
    with: {
      team: true,
    },
  });
}
```

Update imports to include `and`, `asc`, `desc`, and `tournamentTeamStandings`.

- [ ] **Step 2: Create seed board component**

Create `src/components/dashboard/seed-board.tsx`:

```tsx
import { GitBranch, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { publishDoubleEliminationBracket } from "@/features/brackets/actions";

type SeedBoardItem = {
  registrationId: string;
  tournamentId: string;
  tournamentTitle: string;
  teamName: string;
  seed: number | null;
  status: string;
  checkedInAt: Date | null;
  members: unknown[];
};

export function SeedBoard({ tournamentId, title, items, hasBracket }: {
  tournamentId: string;
  title: string;
  items: SeedBoardItem[];
  hasBracket: boolean;
}) {
  return (
    <section className="seed-board">
      <div className="seed-board-head">
        <div>
          <div className="arena-kicker flex items-center gap-2">
            <GitBranch className="size-4" />
            Double elimination seed board
          </div>
          <h2>{title}</h2>
        </div>
        <form action={publishDoubleEliminationBracket}>
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <Button
            disabled={hasBracket || items.length < 2}
            className="arena-button h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]"
          >
            <Rocket className="size-4" />
            {hasBracket ? "Bracket published" : "Publish bracket"}
          </Button>
        </form>
      </div>

      <div className="seed-board-grid">
        {items.map((item, index) => (
          <article key={item.registrationId} className="seed-board-row">
            <strong>#{item.seed ?? index + 1}</strong>
            <div>
              <h3>{item.teamName}</h3>
              <p>{item.members.length} / 6 players · {item.checkedInAt ? "checked in" : item.status}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create shared bracket renderer**

Create `src/components/dashboard/double-elim-bracket.tsx`:

```tsx
import { Crown, GitBranch, Skull, Swords } from "lucide-react";

import type { Match, Team } from "@/db/schema";

type BracketMatch = Match & {
  teamA?: Team | null;
  teamB?: Team | null;
  winner?: Team | null;
};

function laneLabel(bracket: Match["bracket"]) {
  if (bracket === "upper") return "Upper";
  if (bracket === "lower") return "Lower";
  if (bracket === "grand_final_reset") return "Reset Final";
  return "Grand Final";
}

export function DoubleElimBracket({ matches, focusTeamId }: { matches: BracketMatch[]; focusTeamId?: string }) {
  const lanes = ["upper", "lower", "grand_final", "grand_final_reset"] as const;

  return (
    <section className="double-bracket">
      <div className="double-bracket-title">
        <GitBranch className="size-5 text-valorant-red" />
        <h2>Double elimination map</h2>
      </div>

      {lanes.map((lane) => {
        const laneMatches = matches.filter((match) => match.bracket === lane);
        if (!laneMatches.length) return null;

        return (
          <div key={lane} className={`double-bracket-lane double-bracket-${lane}`}>
            <div className="double-bracket-lane-label">{laneLabel(lane)}</div>
            <div className="double-bracket-scroll">
              {laneMatches.map((match) => {
                const focused = focusTeamId && (match.teamAId === focusTeamId || match.teamBId === focusTeamId);
                return (
                  <article key={match.id} className={focused ? "double-match double-match-focus" : "double-match"}>
                    <div className="double-match-meta">
                      <span>R{match.bracketRound ?? match.round} / M{match.bracketMatchNumber ?? match.matchNumber}</span>
                      <strong>{match.status}</strong>
                    </div>
                    <div className="double-match-team">
                      <span>{match.teamA?.name ?? "Waiting for teams"}</span>
                      <b>{match.scoreA}</b>
                    </div>
                    <div className="double-match-team">
                      <span>{match.teamB?.name ?? "Waiting for teams"}</span>
                      <b>{match.scoreB}</b>
                    </div>
                    <div className="double-match-footer">
                      {match.winnerTeamId ? <Crown className="size-4" /> : <Swords className="size-4" />}
                      {match.winner?.name ?? "Awaiting result"}
                      {match.status === "completed" && !match.winnerTeamId ? <Skull className="size-4" /> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 4: Wire admin page**

In `src/app/(dashboard)/dashboard/admin/page.tsx`, load seed-board data and first tournament id from the queue:

```ts
const [queue, matchQueue, seedBoard] = await Promise.all([
  getAdminRegistrationQueue(),
  getAdminMatchQueue(),
  getAdminSeedBoard(),
]);
const firstTournamentId = seedBoard[0]?.tournamentId ?? queue[0]?.tournamentId;
const tournamentItems = firstTournamentId ? seedBoard.filter((item) => item.tournamentId === firstTournamentId) : [];
const tournamentBracket = firstTournamentId ? await getTournamentBracket(firstTournamentId) : [];
```

Render before registration queue:

```tsx
{firstTournamentId ? (
  <>
    <SeedBoard
      tournamentId={firstTournamentId}
      title={tournamentItems[0]?.tournamentTitle ?? "Tournament"}
      items={tournamentItems}
      hasBracket={tournamentBracket.length > 0}
    />
    <DoubleElimBracket matches={tournamentBracket} />
  </>
) : null}
```

Add imports for `SeedBoard`, `DoubleElimBracket`, `getAdminSeedBoard`, and `getTournamentBracket`.

- [ ] **Step 5: Add CSS utilities**

Append to `src/app/globals.css` near the existing dashboard utilities:

```css
.seed-board,
.double-bracket {
  border: 1px solid color-mix(in oklch, var(--valorant-bone) 18%, transparent);
  background: color-mix(in oklch, black 68%, transparent);
  padding: 1.25rem;
}

.seed-board-head,
.double-bracket-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.seed-board-head h2,
.double-bracket-title h2 {
  margin-top: 0.8rem;
  font-family: var(--font-display);
  font-size: clamp(3rem, 7vw, 6.5rem);
  line-height: 0.86;
  text-transform: uppercase;
  color: var(--valorant-bone);
}

.seed-board-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: 1rem;
  background: color-mix(in oklch, var(--valorant-red) 32%, transparent);
}

.seed-board-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.9rem;
  background: color-mix(in oklch, black 72%, transparent);
  padding: 1rem;
}

.seed-board-row strong {
  font-family: var(--font-display);
  font-size: 2.4rem;
  color: var(--valorant-red);
}

.seed-board-row h3,
.double-match-team span {
  color: var(--valorant-bone);
  font-weight: 950;
  text-transform: uppercase;
}

.seed-board-row p,
.double-match-meta,
.double-match-footer {
  color: var(--valorant-muted);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.double-bracket {
  display: grid;
  gap: 1.2rem;
}

.double-bracket-lane {
  border-top: 1px solid color-mix(in oklch, var(--valorant-red) 36%, transparent);
  padding-top: 1rem;
}

.double-bracket-lane-label {
  color: var(--valorant-red);
  font-size: 0.8rem;
  font-weight: 950;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.double-bracket-scroll {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(16rem, 20rem);
  gap: 0.75rem;
  margin-top: 0.8rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
}

.double-match {
  border: 1px solid color-mix(in oklch, var(--valorant-bone) 16%, transparent);
  background: color-mix(in oklch, black 72%, transparent);
  padding: 0.95rem;
}

.double-match-focus {
  border-color: var(--valorant-red);
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--valorant-red) 26%, transparent);
}

.double-match-team {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.55rem;
  border: 1px solid color-mix(in oklch, var(--valorant-bone) 12%, transparent);
  padding: 0.65rem;
}

.double-match-team b {
  color: var(--valorant-red);
}

.double-match-footer {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.7rem;
}

@media (max-width: 64rem) {
  .seed-board-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 48rem) {
  .seed-board-head,
  .double-bracket-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .seed-board-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Verify and commit UI foundation**

Run:

```bash
pnpm typecheck
pnpm lint
```

Expected: both pass.

Commit:

```bash
git add src/features/brackets/queries.ts src/components/dashboard/seed-board.tsx src/components/dashboard/double-elim-bracket.tsx src/app/(dashboard)/dashboard/admin/page.tsx src/app/globals.css
git commit -m "feat: add double elimination admin bracket view"
```

## Task 7: Captain Path, History, And Ranking Foundation

**Files:**
- Create: `src/features/profiles/queries.ts`
- Create: `src/components/dashboard/player-history-panel.tsx`
- Modify: `src/app/(dashboard)/dashboard/brackets/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Test: `pnpm typecheck`

- [ ] **Step 1: Add history queries**

Create `src/features/profiles/queries.ts`:

```ts
import "server-only";

import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { matches, tournamentPlayerSnapshots, tournamentTeamStandings } from "@/db/schema";

export async function getTeamTournamentHistory(tournamentId: string, teamId: string) {
  return db.query.matches.findMany({
    where: and(
      eq(matches.tournamentId, tournamentId),
      or(eq(matches.teamAId, teamId), eq(matches.teamBId, teamId)),
    ),
    orderBy: desc(matches.updatedAt),
    with: {
      teamA: true,
      teamB: true,
      winner: true,
    },
    limit: 12,
  });
}

export async function getTeamTournamentStanding(tournamentId: string, teamId: string) {
  return db.query.tournamentTeamStandings.findFirst({
    where: and(
      eq(tournamentTeamStandings.tournamentId, tournamentId),
      eq(tournamentTeamStandings.teamId, teamId),
    ),
    with: {
      team: true,
    },
  });
}

export async function getUserTournamentAppearances(userId: string) {
  return db.query.tournamentPlayerSnapshots.findMany({
    where: eq(tournamentPlayerSnapshots.userId, userId),
    orderBy: desc(tournamentPlayerSnapshots.createdAt),
    with: {
      tournament: true,
      team: true,
    },
    limit: 20,
  });
}
```

- [ ] **Step 2: Add history panel**

Create `src/components/dashboard/player-history-panel.tsx`:

```tsx
import { Crown, History, ShieldAlert } from "lucide-react";

import type { Match, Team, TournamentTeamStanding } from "@/db/schema";

type HistoryMatch = Match & {
  teamA?: Team | null;
  teamB?: Team | null;
  winner?: Team | null;
};

export function PlayerHistoryPanel({
  standing,
  matches,
  teamId,
}: {
  standing?: (TournamentTeamStanding & { team?: Team | null }) | null;
  matches: HistoryMatch[];
  teamId: string;
}) {
  return (
    <section className="player-history-panel">
      <div className="concept-kicker flex items-center gap-2">
        <History className="size-4" />
        Competitive identity
      </div>
      <div className="player-history-record">
        <strong>{standing ? `${standing.wins}-${standing.losses}` : "0-0"}</strong>
        <span>{standing?.status ?? "awaiting bracket"}</span>
      </div>
      <div className="player-history-list">
        {matches.length ? (
          matches.map((match) => {
            const won = match.winnerTeamId === teamId;
            return (
              <article key={match.id} className={won ? "player-history-row player-history-win" : "player-history-row"}>
                {won ? <Crown className="size-4" /> : <ShieldAlert className="size-4" />}
                <span>
                  {match.teamA?.name ?? "Waiting"} vs {match.teamB?.name ?? "Waiting"}
                </span>
                <b>{match.scoreA}-{match.scoreB}</b>
              </article>
            );
          })
        ) : (
          <p>Match history appears after the bracket goes live.</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add captain bracket view**

In `src/app/(dashboard)/dashboard/brackets/page.tsx`, load bracket and history:

```ts
const bracket = registration ? await getTournamentBracket(registration.tournamentId) : [];
const standing = registration ? await getTeamTournamentStanding(registration.tournamentId, registration.teamId) : null;
const history = registration ? await getTeamTournamentHistory(registration.tournamentId, registration.teamId) : [];
```

Render after `MatchActionPanel`:

```tsx
<DoubleElimBracket matches={bracket} focusTeamId={registration.teamId} />
<PlayerHistoryPanel standing={standing} matches={history} teamId={registration.teamId} />
```

Keep the existing pending state when `bracket.length === 0`.

- [ ] **Step 4: Add captain dashboard record**

In `src/app/(dashboard)/dashboard/page.tsx`, load standing/history after `nextMatch`:

```ts
const standing = activeRegistration
  ? await getTeamTournamentStanding(activeRegistration.tournamentId, activeRegistration.teamId)
  : null;
const history = activeRegistration
  ? await getTeamTournamentHistory(activeRegistration.tournamentId, activeRegistration.teamId)
  : [];
```

Render inside the active registration branch below the control-room layout:

```tsx
<PlayerHistoryPanel
  standing={standing}
  matches={history}
  teamId={activeRegistration.teamId}
/>
```

- [ ] **Step 5: Add CSS for history**

Append to `src/app/globals.css`:

```css
.player-history-panel {
  border: 1px solid color-mix(in oklch, var(--valorant-bone) 18%, transparent);
  background: color-mix(in oklch, black 68%, transparent);
  padding: 1.25rem;
}

.player-history-record strong {
  display: block;
  margin-top: 0.8rem;
  font-family: var(--font-display);
  font-size: clamp(3.5rem, 8vw, 7rem);
  line-height: 0.86;
  color: var(--valorant-bone);
}

.player-history-record span {
  color: var(--valorant-red);
  font-size: 0.85rem;
  font-weight: 950;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.player-history-list {
  display: grid;
  gap: 0.55rem;
  margin-top: 1rem;
}

.player-history-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid color-mix(in oklch, var(--valorant-bone) 12%, transparent);
  padding: 0.75rem;
  color: var(--valorant-muted);
  font-weight: 850;
}

.player-history-win {
  color: var(--valorant-bone);
  border-color: color-mix(in oklch, var(--valorant-green) 42%, transparent);
}
```

- [ ] **Step 6: Verify and commit captain identity surfaces**

Run:

```bash
pnpm typecheck
pnpm lint
```

Expected: both pass.

Commit:

```bash
git add src/features/profiles/queries.ts src/components/dashboard/player-history-panel.tsx src/app/(dashboard)/dashboard/brackets/page.tsx src/app/(dashboard)/dashboard/page.tsx src/app/globals.css
git commit -m "feat: show captain bracket path and history"
```

## Task 8: End-To-End Verification And Browser Pass

**Files:**
- Modify only if verification finds defects in files touched by Tasks 1-7.
- Test: all static checks and browser sanity.

- [ ] **Step 1: Run all pure tests**

Run:

```bash
pnpm exec tsx src/features/brackets/double-elimination.test.ts
pnpm exec tsx src/features/brackets/advancement.test.ts
pnpm exec tsx src/features/admin/match-launch.test.ts
pnpm exec tsx src/features/admin/match-review.test.ts
pnpm exec tsx src/features/admin/registration-review.test.ts
pnpm exec tsx src/features/matchday/results.test.ts
```

Expected: every command prints its `tests passed` line.

- [ ] **Step 2: Run full static verification**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands complete successfully.

- [ ] **Step 3: Apply migration locally**

Run:

```bash
pnpm db:migrate
```

Expected: migration applies to the configured `DATABASE_URL`. If the local database already has generated schema from `db:push`, use `pnpm db:push` only after confirming the developer wants push behavior for this local environment.

- [ ] **Step 4: Browser sanity pass**

Use the Codex in-app browser and inspect:

```txt
http://localhost:3000/
http://localhost:3000/sign-in
http://localhost:3000/dashboard
http://localhost:3000/dashboard/brackets
http://localhost:3000/dashboard/admin
```

Expected:

- Logged-out marketing/sign-in still render.
- Captain dashboard has no overlapping history/bracket panels.
- Bracket page shows pending state before publish and bracket after publish.
- Admin page shows seed board, publish state, queue, result desk, and bracket.
- Mobile viewport stacks seed rows, bracket lanes, and history rows without clipped text.

- [ ] **Step 5: Manual tournament flow**

In the browser:

1. Sign in as admin.
2. Confirm at least two teams are approved or checked in.
3. Publish bracket from `/dashboard/admin`.
4. Open `/dashboard/brackets` as captain and confirm current path is highlighted.
5. Report a captain result.
6. Complete the result from `/dashboard/admin`.
7. Confirm the winner and loser move to their next bracket slots.
8. Complete enough matches to trigger Grand Final.
9. If lower finalist wins Grand Final one, confirm Reset Final appears.
10. Complete Reset Final or upper-side Grand Final win and confirm champion state.

- [ ] **Step 6: Final commit**

If verification fixes required edits, commit them:

```bash
git add .
git commit -m "fix: verify double elimination tournament flow"
```

If no verification fixes were required, do not create an empty commit.

## Self-Review

- Spec coverage: bracket generation, seeds, byes, lower drops, Grand Final reset, admin publish, automatic advancement, standings, snapshots, captain history, and visual bracket all map to tasks.
- Scope control: Discord, proof uploads, LFG, Riot API, real-time sockets, and ELO are not included.
- Type consistency: `BracketLane`, `BracketSlot`, `PlannedBracketMatch`, `createDoubleEliminationPlan`, `resolveMatchAdvancement`, `tournamentTeamStandings`, and `tournamentPlayerSnapshots` are defined before use.
- Verification: pure tests, typecheck, lint, build, migration, and browser flow are specified with concrete commands and expected outcomes.
