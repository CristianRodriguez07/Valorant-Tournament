import { Crown, History, ShieldAlert, Swords } from "lucide-react";

import type { Match, Team, TournamentTeamStanding } from "@/db/schema";

type HistoryMatch = Match & {
  teamA?: Team | null;
  teamB?: Team | null;
  winner?: Team | null;
};

type PlayerHistoryPanelProps = {
  standing?: (TournamentTeamStanding & { team?: Team | null }) | null;
  matches: HistoryMatch[];
  teamId: string;
};

export function PlayerHistoryPanel({ standing, matches, teamId }: PlayerHistoryPanelProps) {
  const status = standing?.status ? standing.status.replaceAll("_", " ") : "awaiting bracket";

  return (
    <section className="player-history-panel tactical-reveal">
      <div className="player-history-head">
        <div className="concept-kicker flex items-center gap-2">
          <History className="size-4" />
          Competitive identity
        </div>
        <span>{standing?.team?.name ?? "Squad record"}</span>
      </div>

      <div className="player-history-record">
        <strong>{standing ? `${standing.wins}-${standing.losses}` : "0-0"}</strong>
        <span>{status}</span>
      </div>

      <div className="player-history-list">
        {matches.length ? (
          matches.map((match) => {
            const won = match.winnerTeamId === teamId;
            const pending = !match.winnerTeamId;

            return (
              <article key={match.id} className={won ? "player-history-row player-history-win" : "player-history-row"}>
                {won ? <Crown className="size-4" /> : pending ? <Swords className="size-4" /> : <ShieldAlert className="size-4" />}
                <span>
                  {match.teamA?.name ?? "Waiting"} vs {match.teamB?.name ?? "Waiting"}
                </span>
                <b>
                  {match.scoreA}-{match.scoreB}
                </b>
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
