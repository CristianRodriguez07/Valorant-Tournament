import { Crown, GitBranch, ShieldAlert, Skull, Swords, Trophy } from "lucide-react";

import type { Match, Team } from "@/db/schema";

type BracketMatch = Match & {
  teamA?: Team | null;
  teamB?: Team | null;
  winner?: Team | null;
};

type BracketLaneId = NonNullable<Match["bracket"]>;

const lanes: Array<{
  id: BracketLaneId;
  label: string;
  callout: string;
}> = [
  { id: "upper", label: "Upper", callout: "no losses" },
  { id: "lower", label: "Lower", callout: "survival route" },
  { id: "grand_final", label: "Grand Final", callout: "title lock" },
  { id: "grand_final_reset", label: "Reset Final", callout: "bracket reset" },
];

export function DoubleElimBracket({
  matches,
  focusTeamId,
}: {
  matches: BracketMatch[];
  focusTeamId?: string;
}) {
  const bracketedMatches = matches.filter((match): match is BracketMatch & { bracket: BracketLaneId } => Boolean(match.bracket));
  const hasLegacyOnly = matches.length > 0 && bracketedMatches.length === 0;
  const completedCount = bracketedMatches.filter((match) => match.status === "completed").length;
  const readyCount = bracketedMatches.filter((match) => match.status === "ready" || match.status === "reported").length;

  return (
    <section className="double-bracket tactical-reveal">
      <div className="double-bracket-title">
        <div>
          <div className="arena-kicker flex items-center gap-2">
            <GitBranch className="size-4" />
            Competitive topology
          </div>
          <h2>Double elimination map</h2>
        </div>
        <div className="double-bracket-stats" aria-label="Bracket status">
          <span>{bracketedMatches.length} matches</span>
          <span>{readyCount} armed</span>
          <span>{completedCount} resolved</span>
        </div>
      </div>

      {bracketedMatches.length ? (
        lanes.map((lane) => {
          const laneMatches = bracketedMatches.filter((match) => match.bracket === lane.id);
          if (!laneMatches.length) {
            return null;
          }

          return (
            <div key={lane.id} className={`double-bracket-lane double-bracket-${lane.id}`}>
              <div className="double-bracket-lane-label">
                <span>{lane.label}</span>
                <strong>{lane.callout}</strong>
              </div>
              <div className="double-bracket-scroll">
                {laneMatches.map((match) => {
                  const focused = focusTeamId && (match.teamAId === focusTeamId || match.teamBId === focusTeamId);
                  return (
                    <article key={match.id} className={focused ? "double-match double-match-focus" : "double-match"}>
                      <div className="double-match-meta">
                        <span>
                          R{match.bracketRound ?? match.round} / M{match.bracketMatchNumber ?? match.matchNumber}
                        </span>
                        <strong>{match.status}</strong>
                      </div>
                      <TeamScore
                        name={match.teamA?.name}
                        score={match.scoreA}
                        winner={match.winnerTeamId === match.teamAId}
                      />
                      <TeamScore
                        name={match.teamB?.name}
                        score={match.scoreB}
                        winner={match.winnerTeamId === match.teamBId}
                      />
                      <div className="double-match-footer">
                        {match.winnerTeamId ? <Crown className="size-4" /> : <Swords className="size-4" />}
                        <span>{match.winner?.name ?? "Awaiting result"}</span>
                        {match.status === "completed" && !match.winnerTeamId ? <Skull className="size-4" /> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <article className="double-bracket-empty">
          <ShieldAlert className="size-5" />
          <h3>{hasLegacyOnly ? "Legacy match data" : "Bracket not published"}</h3>
          <p>
            {hasLegacyOnly
              ? "Existing match assignments were created before the double-elimination topology. Clear or finish them before publishing the full bracket."
              : "Seed at least two squads, then publish to generate upper, lower, grand final and reset-final lanes."}
          </p>
        </article>
      )}
    </section>
  );
}

function TeamScore({ name, score, winner }: { name?: string | null; score: number; winner: boolean }) {
  return (
    <div className={winner ? "double-match-team double-match-team-winner" : "double-match-team"}>
      <span>{name ?? "Waiting for teams"}</span>
      <b>{winner ? <Trophy className="size-4" /> : null}{score}</b>
    </div>
  );
}
