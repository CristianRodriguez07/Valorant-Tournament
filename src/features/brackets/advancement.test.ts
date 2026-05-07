import assert from "node:assert/strict";

import { resolveMatchAdvancement } from "./advancement";
import type { AdvancementMatchInput } from "./advancement";

function match(overrides: Partial<AdvancementMatchInput> = {}): AdvancementMatchInput {
  return {
    id: "match-one",
    bracket: "upper",
    status: "reported",
    teamAId: "team-alpha",
    teamBId: "team-bravo",
    winnerTeamId: "team-alpha",
    scoreA: 1,
    scoreB: 0,
    nextMatchId: "upper-final",
    nextMatchSlot: "team_a",
    loserNextMatchId: "lower-round-one",
    loserNextMatchSlot: "team_b",
    ...overrides,
  };
}

assert.deepEqual(resolveMatchAdvancement(match()), {
  completedMatch: {
    status: "completed",
    winnerTeamId: "team-alpha",
    scoreA: 1,
    scoreB: 0,
  },
  winnerMove: {
    matchId: "upper-final",
    slot: "team_a",
    teamId: "team-alpha",
  },
  loserMove: {
    matchId: "lower-round-one",
    slot: "team_b",
    teamId: "team-bravo",
  },
  championTeamId: null,
  runnerUpTeamId: null,
  createResetFinal: false,
});

assert.deepEqual(
  resolveMatchAdvancement(
    match({
      bracket: "grand_final",
      winnerTeamId: "team-alpha",
      scoreA: 2,
      scoreB: 0,
    }),
  ),
  {
    completedMatch: {
      status: "completed",
      winnerTeamId: "team-alpha",
      scoreA: 2,
      scoreB: 0,
    },
    winnerMove: null,
    loserMove: null,
    championTeamId: "team-alpha",
    runnerUpTeamId: "team-bravo",
    createResetFinal: false,
  },
);

assert.deepEqual(
  resolveMatchAdvancement(
    match({
      bracket: "grand_final",
      winnerTeamId: "team-bravo",
      scoreA: 1,
      scoreB: 2,
    }),
  ),
  {
    completedMatch: {
      status: "completed",
      winnerTeamId: "team-bravo",
      scoreA: 1,
      scoreB: 2,
    },
    winnerMove: null,
    loserMove: null,
    championTeamId: null,
    runnerUpTeamId: null,
    createResetFinal: true,
  },
);

assert.deepEqual(
  resolveMatchAdvancement(
    match({
      bracket: "grand_final_reset",
      winnerTeamId: "team-bravo",
      scoreA: 1,
      scoreB: 2,
    }),
  ),
  {
    completedMatch: {
      status: "completed",
      winnerTeamId: "team-bravo",
      scoreA: 1,
      scoreB: 2,
    },
    winnerMove: null,
    loserMove: null,
    championTeamId: "team-bravo",
    runnerUpTeamId: "team-alpha",
    createResetFinal: false,
  },
);

assert.throws(() => resolveMatchAdvancement(match({ status: "ready" })), /reported/i);
assert.throws(() => resolveMatchAdvancement(match({ winnerTeamId: null })), /winner/i);
assert.throws(() => resolveMatchAdvancement(match({ winnerTeamId: "team-charlie" })), /match teams/i);
assert.throws(() => resolveMatchAdvancement(match({ teamAId: null })), /two teams/i);
assert.throws(
  () => resolveMatchAdvancement(match({ teamAId: null, teamBId: null })),
  /two teams/i,
);

console.log("advancement rules tests passed");
