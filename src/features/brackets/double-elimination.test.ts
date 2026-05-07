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
