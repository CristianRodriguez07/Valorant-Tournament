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
  if (!Number.isInteger(size) || size < 2 || !isPowerOfTwo(size)) {
    throw new Error("Seed order size must be an even power-of-two value.");
  }

  let order = [1, 2];
  while (order.length < size) {
    const nextSize = order.length * 2;
    order = order.flatMap((seed) => [seed, nextSize + 1 - seed]);
  }
  return order;
}

function isPowerOfTwo(value: number) {
  return value > 0 && 2 ** Math.floor(Math.log2(value)) === value;
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

function normalizeTeams(teams: EligibleBracketTeam[]): SeededBracketTeam[] {
  if (teams.length < 2) {
    throw new Error("Double elimination requires at least two eligible teams.");
  }

  return [...teams]
    .sort((a, b) => {
      const aSeed = validSeedOrMax(a.seed);
      const bSeed = validSeedOrMax(b.seed);
      if (aSeed !== bSeed) {
        return aSeed - bSeed;
      }

      const createdAtDifference = a.createdAt.getTime() - b.createdAt.getTime();
      if (createdAtDifference !== 0) {
        return createdAtDifference;
      }

      return a.teamId.localeCompare(b.teamId);
    })
    .map((team, index) => ({
      ...team,
      seed: index + 1,
    }));
}

function validSeedOrMax(seed: number | null) {
  return Number.isInteger(seed) && seed !== null && seed > 0 ? seed : Number.MAX_SAFE_INTEGER;
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
        teamAId: teamIdForSeedOrderIndex(seedOrder, seededBySeed, 0),
        teamBId: teamIdForSeedOrderIndex(seedOrder, seededBySeed, 1),
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
    grand.sourceMatchAPlanId = first.planId;
    grand.sourceMatchBPlanId = first.planId;

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
          displayMatchNumber: displayMatchNumber,
          teamAId: round === 1 ? teamIdForSeedOrderIndex(seedOrder, seededBySeed, orderIndex) : null,
          teamBId: round === 1 ? teamIdForSeedOrderIndex(seedOrder, seededBySeed, orderIndex + 1) : null,
        }),
      );
      displayMatchNumber += 1;

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
    const matchCount = lowerRoundMatchCount(bracketSize, lowerRound);

    for (let number = 1; number <= matchCount; number += 1) {
      add(
        createMatch({
          bracket: "lower",
          bracketRound: lowerRound,
          bracketMatchNumber: number,
          displayRound: upperRounds + lowerRound,
          displayMatchNumber: displayMatchNumber,
        }),
      );
      displayMatchNumber += 1;
    }
  }

  const grandFinal = add(
    createMatch({
      bracket: "grand_final",
      bracketRound: 1,
      bracketMatchNumber: 1,
      displayRound: upperRounds + lowerRoundCount + 1,
      displayMatchNumber: displayMatchNumber,
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

function teamIdForSeedOrderIndex(
  seedOrder: number[],
  seededBySeed: Map<number, SeededBracketTeam>,
  index: number,
) {
  const seed = seedOrder[index];
  if (seed === undefined) {
    return null;
  }
  return seededBySeed.get(seed)?.teamId ?? null;
}

function lowerRoundMatchCount(bracketSize: number, lowerRound: number) {
  if (lowerRound === 1) {
    return bracketSize / 4;
  }

  if (lowerRound % 2 === 0) {
    const upperDropRound = lowerRound / 2 + 1;
    return bracketSize / 2 ** upperDropRound;
  }

  return bracketSize / 2 ** ((lowerRound + 3) / 2);
}

function connectLowerBracket(
  byPlanId: Map<string, PlannedBracketMatch>,
  bracketSize: number,
  upperRounds: number,
  grandFinalPlanId: string,
) {
  const lowerRoundCount = 2 * (upperRounds - 1);
  const upperFinal = byPlanId.get(planId("upper", upperRounds, 1));
  const lowerFinal = byPlanId.get(planId("lower", lowerRoundCount, 1));
  const grandFinal = byPlanId.get(grandFinalPlanId);

  if (upperFinal && grandFinal) {
    upperFinal.nextMatchPlanId = grandFinal.planId;
    upperFinal.nextMatchSlot = "team_a";
    grandFinal.sourceMatchAPlanId = upperFinal.planId;
  }

  if (lowerFinal && grandFinal) {
    lowerFinal.nextMatchPlanId = grandFinal.planId;
    lowerFinal.nextMatchSlot = "team_b";
    grandFinal.sourceMatchBPlanId = lowerFinal.planId;
  }

  for (let round = 1; round <= upperRounds; round += 1) {
    const matchCount = bracketSize / 2 ** round;
    for (let number = 1; number <= matchCount; number += 1) {
      const upperMatch = byPlanId.get(planId("upper", round, number));
      if (!upperMatch) {
        continue;
      }

      const target = lowerTargetForUpperLoser(round, number, bracketSize);
      if (!target) {
        continue;
      }

      const lowerMatch = byPlanId.get(planId("lower", target.round, target.number));
      if (!lowerMatch) {
        continue;
      }

      upperMatch.loserNextMatchPlanId = lowerMatch.planId;
      upperMatch.loserNextMatchSlot = target.slot;
      setSourceMatch(lowerMatch, target.slot, upperMatch.planId);
    }
  }

  for (let round = 1; round <= lowerRoundCount; round += 1) {
    const matchCount = lowerRoundMatchCount(bracketSize, round);
    for (let number = 1; number <= matchCount; number += 1) {
      const lowerMatch = byPlanId.get(planId("lower", round, number));
      if (!lowerMatch) {
        continue;
      }

      if (round === lowerRoundCount) {
        lowerMatch.nextMatchPlanId = grandFinalPlanId;
        lowerMatch.nextMatchSlot = "team_b";
        continue;
      }

      const target = lowerTargetForLowerWinner(round, number);
      const nextLowerMatch = byPlanId.get(planId("lower", target.round, target.number));
      if (!nextLowerMatch) {
        continue;
      }

      lowerMatch.nextMatchPlanId = nextLowerMatch.planId;
      lowerMatch.nextMatchSlot = target.slot;
      setSourceMatch(nextLowerMatch, target.slot, lowerMatch.planId);
    }
  }
}

function lowerTargetForUpperLoser(
  upperRound: number,
  upperMatchNumber: number,
  bracketSize: number,
): { round: number; number: number; slot: BracketSlot } | null {
  if (upperRound === 1) {
    return {
      round: 1,
      number: Math.floor((upperMatchNumber - 1) / 2) + 1,
      slot: slotForIndex(upperMatchNumber - 1),
    };
  }

  const targetRound = 2 * (upperRound - 1);
  const targetMatchCount = bracketSize / 2 ** upperRound;
  const targetNumber = Math.min(upperMatchNumber, targetMatchCount);

  return {
    round: targetRound,
    number: targetNumber,
    slot: "team_b",
  };
}

function lowerTargetForLowerWinner(
  lowerRound: number,
  lowerMatchNumber: number,
): { round: number; number: number; slot: BracketSlot } {
  if (lowerRound % 2 === 1) {
    return {
      round: lowerRound + 1,
      number: lowerMatchNumber,
      slot: "team_a",
    };
  }

  return {
    round: lowerRound + 1,
    number: Math.floor((lowerMatchNumber - 1) / 2) + 1,
    slot: slotForIndex(lowerMatchNumber - 1),
  };
}

function setSourceMatch(match: PlannedBracketMatch, slot: BracketSlot, sourcePlanId: string) {
  if (slot === "team_a") {
    match.sourceMatchAPlanId = sourcePlanId;
    return;
  }

  match.sourceMatchBPlanId = sourcePlanId;
}

function applyByes(matches: PlannedBracketMatch[], byPlanId: Map<string, PlannedBracketMatch>) {
  for (const match of matches) {
    if (match.bracket !== "upper" || match.bracketRound !== 1 || match.status === "completed") {
      continue;
    }

    const hasTeamA = match.teamAId !== null;
    const hasTeamB = match.teamBId !== null;
    if (hasTeamA === hasTeamB) {
      continue;
    }

    const winnerTeamId = match.teamAId ?? match.teamBId;
    if (!winnerTeamId) {
      continue;
    }

    match.status = "completed";
    match.winnerTeamId = winnerTeamId;
    match.scoreA = hasTeamA ? 1 : 0;
    match.scoreB = hasTeamB ? 1 : 0;

    if (!match.nextMatchPlanId || !match.nextMatchSlot) {
      continue;
    }

    const nextMatch = byPlanId.get(match.nextMatchPlanId);
    if (!nextMatch) {
      continue;
    }

    placeTeam(nextMatch, match.nextMatchSlot, winnerTeamId);
    refreshReadyStatus(nextMatch);
  }
}

function refreshReadyStatus(match: PlannedBracketMatch) {
  if (match.status !== "completed" && match.teamAId && match.teamBId) {
    match.status = "ready";
  }
}
