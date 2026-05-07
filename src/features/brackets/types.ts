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
